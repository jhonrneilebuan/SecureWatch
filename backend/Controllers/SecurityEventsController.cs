using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecureWatch.Api.Data;
using SecureWatch.Api.DTOs;
using SecureWatch.Api.Models;
using SecureWatch.Api.Services;
using System.Security.Claims;

namespace SecureWatch.Api.Controllers;

[ApiController]
[Route("api/security-events")]
[Authorize(Roles = "Admin,Analyst")]
public sealed class SecurityEventsController(
    AppDbContext dbContext,
    IAiRecommendationService aiRecommendationService,
    IIpReputationService ipReputationService,
    IEmailAlertService emailAlertService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<IngestSecurityEventResponse>> Ingest(IngestSecurityEventRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var detection = Detect(request);
        var securityLog = new SecurityLog
        {
            Id = Guid.NewGuid(),
            FileName = $"{request.SourceSystem}-{DateTimeOffset.UtcNow:yyyyMMddHHmmss}.event",
            ContentType = "application/json",
            FileSize = (request.Message ?? string.Empty).Length,
            SourceSystem = request.SourceSystem.Trim(),
            SourceType = "Realtime Event",
            UploadedBy = userId,
            UploadedAt = request.OccurredAt ?? DateTimeOffset.UtcNow,
            Status = detection.ThreatDetected ? SecurityLogStatus.ThreatDetected : SecurityLogStatus.Analyzed,
            FailedLoginAttempts = detection.FailedAttempts
        };

        await dbContext.SecurityLogs.AddAsync(securityLog, cancellationToken);

        if (!detection.ThreatDetected)
        {
            await dbContext.AuditLogs.AddAsync(new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = "Realtime security event received",
                EntityType = nameof(SecurityLog),
                EntityId = securityLog.Id,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty
            }, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Ok(new IngestSecurityEventResponse(false, null, null, "Security event received. No threat threshold matched."));
        }

        var ai = await aiRecommendationService.GenerateAsync(new AiRecommendationRequest(
            detection.ThreatType,
            detection.Severity.ToString(),
            request.SourceIp,
            detection.FailedAttempts,
            detection.RiskScore,
            request.Message), cancellationToken);

        var mitre = MitreMapper.Map(detection.ThreatType);
        var threat = new Threat
        {
            Id = Guid.NewGuid(),
            SecurityLogId = securityLog.Id,
            ThreatType = detection.ThreatType,
            Severity = detection.Severity,
            SourceIP = request.SourceIp,
            FailedAttempts = detection.FailedAttempts,
            RiskScore = detection.RiskScore,
            Description = detection.Description,
            Recommendation = ai.RecommendedActions,
            AiExplanation = ai.ThreatExplanation,
            AiImpact = ai.PossibleImpact,
            AiPreventionSteps = ai.PreventionSteps,
            MitreTechniqueId = mitre.Id,
            MitreTechniqueName = mitre.Name
        };

        await dbContext.Threats.AddAsync(threat, cancellationToken);

        Incident? incident = null;
        if (threat.Severity is ThreatSeverity.High or ThreatSeverity.Critical)
        {
            incident = new Incident
            {
                Id = Guid.NewGuid(),
                ThreatId = threat.Id,
                Title = $"{threat.Severity} {threat.ThreatType}",
                Description = threat.Description,
                Priority = Enum.Parse<IncidentPriority>(threat.Severity.ToString()),
                Status = IncidentStatus.Open
            };
            await dbContext.Incidents.AddAsync(incident, cancellationToken);
        }

        await dbContext.Notifications.AddAsync(new Notification
        {
            Id = Guid.NewGuid(),
            Title = $"{threat.Severity} threat detected",
            Message = $"{threat.ThreatType} from {threat.SourceIP} mapped to MITRE {threat.MitreTechniqueId}.",
            Severity = threat.Severity is ThreatSeverity.Critical ? NotificationSeverity.Critical : NotificationSeverity.Warning,
            EntityType = nameof(Threat),
            EntityId = threat.Id
        }, cancellationToken);
        await dbContext.AuditLogs.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = "Realtime threat detected",
            EntityType = nameof(Threat),
            EntityId = threat.Id,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty
        }, cancellationToken);

        if (!string.IsNullOrWhiteSpace(threat.SourceIP))
        {
            await ipReputationService.CheckAsync(threat.SourceIP, cancellationToken);
        }

        await emailAlertService.SendThreatAlertAsync(threat, incident, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new IngestSecurityEventResponse(true, threat.Id, incident?.Id, "Realtime security event created a threat."));
    }

    private static DetectionResult Detect(IngestSecurityEventRequest request)
    {
        var eventText = $"{request.EventType} {request.Route} {request.Message}".ToLowerInvariant();
        var count = Math.Max(request.Count, 1);

        if (eventText.Contains("sql") || eventText.Contains("' or '1'='1") || eventText.Contains("union select"))
        {
            return new(true, "SQL Injection Attempt", ThreatSeverity.High, 88, 0, $"Potential SQL injection pattern detected from {request.SourceIp}.");
        }

        if (eventText.Contains("privilege") || eventText.Contains("role escalation"))
        {
            return new(true, "Privilege Escalation Attempt", ThreatSeverity.Critical, 95, 0, $"Possible privilege escalation activity detected for {request.Username ?? "unknown user"}.");
        }

        if (eventText.Contains("impossible travel") || eventText.Contains("geo-velocity") || eventText.Contains("geovelocity"))
        {
            return new(true, "Impossible Travel Login", ThreatSeverity.High, 90, 0, $"Impossible travel behavior was reported for {request.Username ?? "unknown user"} from {request.SourceIp}.");
        }

        if (eventText.Contains("admin") && (eventText.Contains("403") || eventText.Contains("401") || eventText.Contains("denied")))
        {
            return new(true, "Suspicious Admin Access", count >= 5 ? ThreatSeverity.High : ThreatSeverity.Medium, count >= 5 ? 85 : 60, count, $"Repeated denied admin access from {request.SourceIp}.");
        }

        if (eventText.Contains("failed") || eventText.Contains("login_failed") || eventText.Contains("401"))
        {
            var severity = count >= 10 ? ThreatSeverity.Critical : count >= 5 ? ThreatSeverity.High : count >= 3 ? ThreatSeverity.Medium : ThreatSeverity.Low;
            return new(count >= 3, "Realtime Brute Force Pattern", severity, Math.Min(100, count * 18), count, $"{count} failed authentication event(s) received from {request.SourceIp}.");
        }

        return new(false, string.Empty, ThreatSeverity.Low, 0, 0, string.Empty);
    }

    private sealed record DetectionResult(bool ThreatDetected, string ThreatType, ThreatSeverity Severity, int RiskScore, int FailedAttempts, string Description);
}
