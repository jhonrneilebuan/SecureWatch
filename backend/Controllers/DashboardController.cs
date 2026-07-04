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
        var failedLoginAttempts = await dbContext.SecurityLogs.SumAsync(x => x.FailedLoginAttempts, cancellationToken);

        var severity = await dbContext.Threats
            .GroupBy(x => x.Severity)
            .Select(x => new SeverityCountDto(x.Key.ToString(), x.Count()))
            .ToListAsync(cancellationToken);

        var since = new DateTimeOffset(DateTime.UtcNow.Date.AddDays(-6), TimeSpan.Zero);
        var recentThreats = await dbContext.Threats
            .Where(x => x.CreatedAt >= since)
            .ToListAsync(cancellationToken);

        var timeline = Enumerable.Range(0, 7)
            .Select(offset => since.AddDays(offset))
            .Select(date => new TimelinePointDto(
                date.ToString("MMM dd"),
                recentThreats.Count(x => x.CreatedAt.UtcDateTime.Date == date)))
            .ToList();

        var sourceIps = await dbContext.Threats
            .AsNoTracking()
            .Select(x => x.SourceIP)
            .ToListAsync(cancellationToken);

        var topIps = sourceIps
            .GroupBy(x => x)
            .Select(x => new IpCountDto(x.Key, x.Count()))
            .OrderByDescending(x => x.Count)
            .Take(5)
            .ToList();

        var incidentStatus = await dbContext.Incidents
            .GroupBy(x => x.Status)
            .Select(x => new StatusCountDto(x.Key.ToString(), x.Count()))
            .ToListAsync(cancellationToken);

        return Ok(new DashboardSummaryDto(totalLogs, threatsDetected, highRiskAlerts, criticalAlerts, activeIncidents, resolvedIncidents, maliciousIps, failedLoginAttempts, severity, timeline, topIps, incidentStatus));
    }
}
