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
    public async Task<ActionResult<IReadOnlyCollection<ThreatDto>>> GetAll(CancellationToken cancellationToken)
    {
        var threats = await dbContext.Threats
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new ThreatDto(x.Id, x.SecurityLogId, x.ThreatType, x.Severity.ToString(), x.SourceIP, x.FailedAttempts, x.RiskScore, x.Description, x.Recommendation, x.AiExplanation, x.AiImpact, x.AiPreventionSteps, x.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(threats);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ThreatDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var threat = await dbContext.Threats.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (threat is null)
        {
            return NotFound();
        }

        return Ok(new ThreatDto(threat.Id, threat.SecurityLogId, threat.ThreatType, threat.Severity.ToString(), threat.SourceIP, threat.FailedAttempts, threat.RiskScore, threat.Description, threat.Recommendation, threat.AiExplanation, threat.AiImpact, threat.AiPreventionSteps, threat.CreatedAt));
    }
}
