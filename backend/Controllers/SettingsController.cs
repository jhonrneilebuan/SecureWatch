using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Data;
using SecureWatch.Api.DTOs;

namespace SecureWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public sealed class SettingsController(IConfiguration configuration, AppDbContext dbContext) : ControllerBase
{
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus(CancellationToken cancellationToken)
    {
        var recentAlerts = await dbContext.EmailAlerts.CountAsync(cancellationToken);
        var failedAlerts = await dbContext.EmailAlerts.CountAsync(x => x.Status == SecureWatch.Api.Models.EmailAlertStatus.Failed, cancellationToken);
        return Ok(new SystemStatusDto(
            !string.IsNullOrWhiteSpace(configuration["Smtp:Host"]) && !string.IsNullOrWhiteSpace(configuration["Smtp:To"]),
            !string.IsNullOrWhiteSpace(configuration["OpenAI:ApiKey"]),
            !string.IsNullOrWhiteSpace(configuration["AbuseIPDB:ApiKey"]),
            !string.IsNullOrWhiteSpace(configuration["Nvd:ApiKey"]),
            5,
            recentAlerts,
            failedAlerts));
    }
}
