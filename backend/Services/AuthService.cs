using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Configuration;
using SecureWatch.Api.DTOs;
using SecureWatch.Api.Models;
using SecureWatch.Api.Repositories;

namespace SecureWatch.Api.Services;

public sealed class AuthService(
    IUserRepository users,
    IPasswordHasher passwordHasher,
    IPasswordPolicy passwordPolicy,
    SecureWatch.Api.Data.AppDbContext dbContext,
    IAiRecommendationService aiRecommendationService,
    IEmailAlertService emailAlertService,
    IOptions<JwtSettings> jwtOptions) : IAuthService
{
    private readonly JwtSettings _jwt = jwtOptions.Value;
    private const int LockoutThreshold = 5;

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await users.GetByEmailAsync(normalizedEmail, cancellationToken) is not null)
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        passwordPolicy.Validate(request.Password);
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = passwordHasher.Hash(request.Password),
            Role = request.Role
        };
        var refreshToken = IssueRefreshToken(user);

        await users.AddAsync(user, cancellationToken);
        await users.SaveChangesAsync(cancellationToken);

        return CreateResponse(user, refreshToken);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string ipAddress, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await users.GetByEmailAsync(normalizedEmail, cancellationToken);

        // If the account is currently locked, return immediately without recording
        // another failed attempt — otherwise every try would reset the 15-min timer.
        var locked = user?.LockedUntil is not null && user.LockedUntil > DateTimeOffset.UtcNow;
        if (locked)
        {
            var remaining = (int)Math.Ceiling((user!.LockedUntil!.Value - DateTimeOffset.UtcNow).TotalMinutes);
            throw new UnauthorizedAccessException($"Account is temporarily locked. Try again in {remaining} minute(s).");
        }

        var passwordValid = user is not null && user.IsActive && passwordHasher.Verify(request.Password, user.PasswordHash);

        if (user is null || !user.IsActive || !passwordValid)
        {
            await RecordFailedLoginAsync(normalizedEmail, ipAddress, user, cancellationToken);
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        user.FailedLoginCount = 0;
        user.LockedUntil = null;
        var refreshToken = IssueRefreshToken(user);

        await dbContext.AuditLogs.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Action = "User login",
            EntityType = nameof(User),
            EntityId = user.Id,
            IpAddress = ipAddress
        }, cancellationToken);
        await dbContext.LoginAttempts.AddAsync(new LoginAttempt
        {
            Id = Guid.NewGuid(),
            Email = user.Email,
            IpAddress = ipAddress,
            Succeeded = true
        }, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreateResponse(user, refreshToken);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshTokenRequest request, string ipAddress, CancellationToken cancellationToken)
    {
        var tokenHash = HashRefreshToken(request.RefreshToken);
        var user = await dbContext.Users.FirstOrDefaultAsync(x =>
            x.RefreshTokenHash == tokenHash &&
            x.RefreshTokenExpiresAt > DateTimeOffset.UtcNow &&
            x.IsActive, cancellationToken);

        if (user is null)
        {
            throw new UnauthorizedAccessException("Refresh token is invalid or expired.");
        }

        var refreshToken = IssueRefreshToken(user);
        await dbContext.AuditLogs.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Action = "Session refreshed",
            EntityType = nameof(User),
            EntityId = user.Id,
            IpAddress = ipAddress
        }, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreateResponse(user, refreshToken);
    }

    private async Task RecordFailedLoginAsync(string email, string ipAddress, User? user, CancellationToken cancellationToken)
    {
        await dbContext.LoginAttempts.AddAsync(new LoginAttempt
        {
            Id = Guid.NewGuid(),
            Email = email,
            IpAddress = ipAddress,
            Succeeded = false
        }, cancellationToken);

        await dbContext.AuditLogs.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = user?.Id ?? Guid.Empty,
            Action = "Failed login",
            EntityType = nameof(LoginAttempt),
            IpAddress = ipAddress
        }, cancellationToken);

        if (user is not null)
        {
            user.FailedLoginCount += 1;
        }

        var since = DateTimeOffset.UtcNow.AddMinutes(-15);
        // Use the user's own FailedLoginCount (already incremented above) as the
        // authoritative counter — it gets reset on successful login AND on manual admin unlock,
        // so it cannot cause instant re-lockout after a DB reset.
        var recentFailures = user?.FailedLoginCount ?? LockoutThreshold;

        if (recentFailures >= LockoutThreshold)
        {
            if (user is not null)
            {
                user.LockedUntil = DateTimeOffset.UtcNow.AddMinutes(15);
            }

            var existingRecentThreat = await dbContext.Threats.AnyAsync(x =>
                x.ThreatType == "SecureWatch Login Brute Force" &&
                x.SourceIP == ipAddress &&
                x.CreatedAt >= since, cancellationToken);

            if (!existingRecentThreat)
            {
                var ai = await aiRecommendationService.GenerateAsync(new AiRecommendationRequest(
                    "SecureWatch Login Brute Force",
                    ThreatSeverity.High.ToString(),
                    ipAddress,
                    recentFailures,
                    90,
                    $"Failed login attempts for {email}"), cancellationToken);

                var threat = new Threat
                {
                    Id = Guid.NewGuid(),
                    ThreatType = "SecureWatch Login Brute Force",
                    Severity = ThreatSeverity.High,
                    SourceIP = ipAddress,
                    FailedAttempts = recentFailures,
                    RiskScore = 90,
                    Description = $"{recentFailures} failed SecureWatch login attempts were detected for {email} from {ipAddress}.",
                    Recommendation = ai.RecommendedActions,
                    MitreTechniqueId = "T1110",
                    MitreTechniqueName = "Brute Force",
                    AiExplanation = ai.ThreatExplanation,
                    AiImpact = ai.PossibleImpact,
                    AiPreventionSteps = ai.PreventionSteps
                };

                var incident = new Incident
                {
                    Id = Guid.NewGuid(),
                    ThreatId = threat.Id,
                    Title = "High SecureWatch Login Brute Force",
                    Description = threat.Description,
                    Priority = IncidentPriority.High,
                    Status = IncidentStatus.Open
                };

                await dbContext.Threats.AddAsync(threat, cancellationToken);
                await dbContext.Incidents.AddAsync(incident, cancellationToken);
                await dbContext.AuditLogs.AddAsync(new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = user?.Id ?? Guid.Empty,
                    Action = "Login brute-force threat detected",
                    EntityType = nameof(Threat),
                    EntityId = threat.Id,
                    IpAddress = ipAddress
                }, cancellationToken);
                await dbContext.Notifications.AddAsync(new Notification
                {
                    Id = Guid.NewGuid(),
                    Title = "High SecureWatch login brute force",
                    Message = $"{recentFailures} failed login attempts from {ipAddress} mapped to MITRE T1110.",
                    Severity = NotificationSeverity.Warning,
                    EntityType = nameof(Threat),
                    EntityId = threat.Id
                }, cancellationToken);
                await emailAlertService.SendThreatAlertAsync(threat, incident, cancellationToken);
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RecordLogoutAsync(Guid userId, string ipAddress, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FindAsync([userId], cancellationToken);
        if (user is not null)
        {
            user.RefreshTokenHash = null;
            user.RefreshTokenExpiresAt = null;
        }

        await dbContext.AuditLogs.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "User logout",
            EntityType = nameof(User),
            EntityId = userId,
            IpAddress = ipAddress
        }, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private AuthResponse CreateResponse(User user, string refreshToken)
    {
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_jwt.ExpiresMinutes);
        return new(CreateToken(user, expiresAt), refreshToken, user.Email, user.FullName, user.Role, expiresAt);
    }

    private string CreateToken(User user, DateTimeOffset expiresAt)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string IssueRefreshToken(User user)
    {
        var tokenBytes = RandomNumberGenerator.GetBytes(64);
        var refreshToken = Convert.ToBase64String(tokenBytes);
        user.RefreshTokenHash = HashRefreshToken(refreshToken);
        user.RefreshTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(_jwt.RefreshTokenDays);
        return refreshToken;
    }

    private static string HashRefreshToken(string token)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(hash);
    }
}
