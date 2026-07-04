using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SecureWatch.Api.Configuration;
using SecureWatch.Api.DTOs;
using SecureWatch.Api.Models;
using SecureWatch.Api.Repositories;

namespace SecureWatch.Api.Services;

public sealed class AuthService(
    IUserRepository users,
    IPasswordHasher passwordHasher,
    SecureWatch.Api.Data.AppDbContext dbContext,
    IOptions<JwtSettings> jwtOptions) : IAuthService
{
    private readonly JwtSettings _jwt = jwtOptions.Value;

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await users.GetByEmailAsync(normalizedEmail, cancellationToken) is not null)
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = passwordHasher.Hash(request.Password),
            Role = request.Role
        };

        await users.AddAsync(user, cancellationToken);
        await users.SaveChangesAsync(cancellationToken);

        return CreateResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await users.GetByEmailAsync(request.Email.Trim().ToLowerInvariant(), cancellationToken);
        if (user is null || !user.IsActive || !passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        await dbContext.AuditLogs.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Action = "User login",
            EntityType = nameof(User),
            EntityId = user.Id
        }, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreateResponse(user);
    }

    public async Task RecordLogoutAsync(Guid userId, string ipAddress, CancellationToken cancellationToken)
    {
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

    private AuthResponse CreateResponse(User user) =>
        new(CreateToken(user), user.Email, user.FullName, user.Role);

    private string CreateToken(User user)
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
            expires: DateTime.UtcNow.AddMinutes(_jwt.ExpiresMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
