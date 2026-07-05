using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Data;
using SecureWatch.Api.DTOs;

namespace SecureWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Analyst")]
public sealed class EmailAlertsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var alerts = await dbContext.EmailAlerts.AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .Select(x => new EmailAlertDto(x.Id, x.ThreatId, x.Recipients, x.Subject, x.Status.ToString(), x.ErrorMessage, x.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(alerts);
    }
}
