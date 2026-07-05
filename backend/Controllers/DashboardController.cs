using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Data;
using SecureWatch.Api.DTOs;
using SecureWatch.Api.Models;

namespace SecureWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Analyst")]
public sealed class DashboardController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary(CancellationToken cancellationToken)
    {
        var totalLogs = await dbContext.SecurityLogs.CountAsync(cancellationToken);
        var threatsDetected = await dbContext.Threats.CountAsync(cancellationToken);
        var highRiskAlerts = await dbContext.Threats.CountAsync(x => x.Severity == ThreatSeverity.High || x.Severity == ThreatSeverity.Critical, cancellationToken);
        var criticalAlerts = await dbContext.Threats.CountAsync(x => x.Severity == ThreatSeverity.Critical, cancellationToken);
        var activeIncidents = await dbContext.Incidents.CountAsync(x => x.Status == IncidentStatus.Open || x.Status == IncidentStatus.Investigating, cancellationToken);
        var resolvedIncidents = await dbContext.Incidents.CountAsync(x => x.Status == IncidentStatus.Resolved || x.Status == IncidentStatus.Closed, cancellationToken);
        var maliciousIps = await dbContext.IpReputations.CountAsync(x => x.IsMalicious, cancellationToken);
        var uploadedFailedLogins = await dbContext.SecurityLogs.SumAsync(x => x.FailedLoginAttempts, cancellationToken);
        var applicationFailedLogins = await dbContext.LoginAttempts.CountAsync(x => !x.Succeeded, cancellationToken);
        var failedLoginAttempts = uploadedFailedLogins + applicationFailedLogins;

        var threatMetrics = await dbContext.Threats
            .AsNoTracking()
            .Select(x => new { x.Severity, x.SourceIP, x.CreatedAt })
            .ToListAsync(cancellationToken);

        var severity = threatMetrics
            .GroupBy(x => x.Severity)
            .Select(x => new SeverityCountDto(x.Key.ToString(), x.Count()))
            .ToList();

        var since = new DateTimeOffset(DateTime.UtcNow.Date.AddDays(-6), TimeSpan.Zero);
        var recentThreats = threatMetrics
            .Where(x => x.CreatedAt >= since)
            .ToList();

        var timeline = Enumerable.Range(0, 7)
            .Select(offset => since.AddDays(offset))
            .Select(date => new TimelinePointDto(
                date.ToString("MMM dd"),
                recentThreats.Count(x => x.CreatedAt.UtcDateTime.Date == date.UtcDateTime.Date)))
            .ToList();

        var recentUploadedLogs = await dbContext.SecurityLogs
            .Where(x => x.UploadedAt >= since)
            .Select(x => new { x.UploadedAt, x.FailedLoginAttempts })
            .ToListAsync(cancellationToken);
        var recentApplicationFailures = await dbContext.LoginAttempts
            .Where(x => !x.Succeeded && x.AttemptedAt >= since)
            .Select(x => x.AttemptedAt)
            .ToListAsync(cancellationToken);
        var failedLoginTimeline = Enumerable.Range(0, 7)
            .Select(offset => since.AddDays(offset))
            .Select(date => new FailedLoginTimelineDto(
                date.ToString("MMM dd"),
                recentUploadedLogs.Where(x => x.UploadedAt.UtcDateTime.Date == date.UtcDateTime.Date).Sum(x => x.FailedLoginAttempts) +
                recentApplicationFailures.Count(x => x.UtcDateTime.Date == date.UtcDateTime.Date)))
            .ToList();

        var topIps = threatMetrics
            .Where(x => !string.IsNullOrWhiteSpace(x.SourceIP))
            .GroupBy(x => x.SourceIP)
            .Select(x => new IpCountDto(x.Key, x.Count()))
            .OrderByDescending(x => x.Count)
            .Take(5)
            .ToList();

        var reputationMetrics = await dbContext.IpReputations
            .AsNoTracking()
            .Select(x => new { x.CountryCode, x.Isp })
            .ToListAsync(cancellationToken);

        var topCountries = reputationMetrics
            .Where(x => !string.IsNullOrWhiteSpace(x.CountryCode))
            .GroupBy(x => x.CountryCode)
            .Select(x => new ReputationSourceDto(x.Key, x.Count()))
            .OrderByDescending(x => x.Count)
            .Take(5)
            .ToList();

        var topIsps = reputationMetrics
            .Where(x => !string.IsNullOrWhiteSpace(x.Isp) && x.Isp != "Lookup unavailable")
            .GroupBy(x => x.Isp)
            .Select(x => new ReputationSourceDto(x.Key, x.Count()))
            .OrderByDescending(x => x.Count)
            .Take(5)
            .ToList();

        var incidentStatusValues = await dbContext.Incidents
            .AsNoTracking()
            .Select(x => x.Status)
            .ToListAsync(cancellationToken);
        var incidentStatus = incidentStatusValues
            .GroupBy(x => x)
            .Select(x => new StatusCountDto(x.Key.ToString(), x.Count()))
            .ToList();

        return Ok(new DashboardSummaryDto(totalLogs, threatsDetected, highRiskAlerts, criticalAlerts, activeIncidents, resolvedIncidents, maliciousIps, failedLoginAttempts, severity, timeline, failedLoginTimeline, topIps, topCountries, topIsps, incidentStatus));
    }
}
