using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Data;
using SecureWatch.Api.DTOs;

namespace SecureWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Analyst")]
public sealed class ThreatsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<ThreatDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? severity,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 5, 100);
        var query = dbContext.Threats.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.ThreatType.Contains(search) || x.SourceIP.Contains(search) || x.Description.Contains(search));
        }

        if (Enum.TryParse<SecureWatch.Api.Models.ThreatSeverity>(severity, true, out var parsedSeverity))
        {
            query = query.Where(x => x.Severity == parsedSeverity);
        }

        var total = await query.CountAsync(cancellationToken);
        var threats = await query.OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new ThreatDto(x.Id, x.SecurityLogId, x.ThreatType, x.Severity.ToString(), x.SourceIP, x.FailedAttempts, x.RiskScore, x.Description, x.Recommendation, x.MitreTechniqueId, x.MitreTechniqueName, x.AiExplanation, x.AiImpact, x.AiPreventionSteps, x.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<ThreatDto>(threats, page, pageSize, total, (int)Math.Ceiling(total / (double)pageSize)));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ThreatDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var threat = await dbContext.Threats.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (threat is null)
        {
            return NotFound();
        }

        return Ok(new ThreatDto(threat.Id, threat.SecurityLogId, threat.ThreatType, threat.Severity.ToString(), threat.SourceIP, threat.FailedAttempts, threat.RiskScore, threat.Description, threat.Recommendation, threat.MitreTechniqueId, threat.MitreTechniqueName, threat.AiExplanation, threat.AiImpact, threat.AiPreventionSteps, threat.CreatedAt));
    }
}
