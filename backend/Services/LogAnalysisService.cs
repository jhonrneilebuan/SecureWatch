using SecureWatch.Api.Data;
using SecureWatch.Api.DTOs;
using SecureWatch.Api.Models;

namespace SecureWatch.Api.Services;

public sealed class LogAnalysisService(
    AppDbContext dbContext,
    ISecurityEngineClient securityEngineClient,
    IAiRecommendationService aiRecommendationService,
    IIpReputationService ipReputationService,
    IEmailAlertService emailAlertService) : ILogAnalysisService
{
    private static readonly string[] AllowedExtensions = [".log", ".txt", ".csv"];
    private const long MaxFileSize = 10 * 1024 * 1024;

    public async Task<SecurityEngineResult> UploadAndAnalyzeAsync(IFormFile file, Guid userId, CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException("Only .log, .txt, and .csv files are supported.");
        }

        if (file.Length is <= 0 or > MaxFileSize)
        {
            throw new InvalidOperationException("Log file must be non-empty and 10 MB or smaller.");
        }

        var securityLog = new SecurityLog
        {
            Id = Guid.NewGuid(),
            FileName = file.FileName,
            FileSize = file.Length,
            ContentType = file.ContentType,
            UploadedBy = userId,
            Status = SecurityLogStatus.Uploaded
        };

        await dbContext.SecurityLogs.AddAsync(securityLog, cancellationToken);

        var result = await securityEngineClient.AnalyzeLogAsync(file, cancellationToken);
        securityLog.Status = result.ThreatDetected ? SecurityLogStatus.ThreatDetected : SecurityLogStatus.Analyzed;
        securityLog.FailedLoginAttempts = result.FailedAttempts;
        securityLog.SuccessfulLogins = result.SuccessfulLogins;

        if (result.ThreatDetected)
        {
            var mitre = MitreMapper.Map(result.ThreatType);
            var threat = new Threat
            {
                Id = Guid.NewGuid(),
                SecurityLogId = securityLog.Id,
                ThreatType = result.ThreatType ?? "Suspicious Activity",
                Severity = Enum.TryParse<ThreatSeverity>(result.Severity, true, out var severity) ? severity : ThreatSeverity.Medium,
                SourceIP = result.SourceIp ?? "Unknown",
                FailedAttempts = result.FailedAttempts,
                RiskScore = result.RiskScore,
                Description = result.Description ?? "Potentially malicious behavior was detected in the uploaded log.",
                Recommendation = result.Recommendation ?? "Review affected accounts, rotate credentials, and verify host activity.",
                MitreTechniqueId = result.MitreTechniqueId ?? mitre.Id,
                MitreTechniqueName = result.MitreTechniqueName ?? mitre.Name
            };

            var ai = await aiRecommendationService.GenerateAsync(new AiRecommendationRequest(
                threat.ThreatType,
                threat.Severity.ToString(),
                threat.SourceIP,
                threat.FailedAttempts,
                threat.RiskScore,
                null), cancellationToken);

            threat.AiExplanation = ai.ThreatExplanation;
            threat.AiImpact = ai.PossibleImpact;
            threat.AiPreventionSteps = ai.PreventionSteps;
            threat.Recommendation = ai.RecommendedActions;

            if (!string.IsNullOrWhiteSpace(threat.SourceIP) && threat.SourceIP != "Unknown")
            {
                await ipReputationService.CheckAsync(threat.SourceIP, cancellationToken);
            }

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

            await dbContext.AuditLogs.AddAsync(new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = "Threat detected",
                EntityType = nameof(Threat),
                EntityId = threat.Id
            }, cancellationToken);
            await dbContext.Notifications.AddAsync(new Notification
            {
                Id = Guid.NewGuid(),
                Title = $"{threat.Severity} threat detected",
                Message = $"{threat.ThreatType} from {threat.SourceIP} mapped to MITRE {threat.MitreTechniqueId}.",
                Severity = threat.Severity is ThreatSeverity.Critical ? NotificationSeverity.Critical : NotificationSeverity.Warning,
                EntityType = nameof(Threat),
                EntityId = threat.Id
            }, cancellationToken);

            await emailAlertService.SendThreatAlertAsync(threat, incident, cancellationToken);
        }

        await dbContext.AuditLogs.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = $"Uploaded and analyzed log file: {file.FileName}",
            EntityType = nameof(SecurityLog),
            EntityId = securityLog.Id
        }, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);
        return result;
    }
}
