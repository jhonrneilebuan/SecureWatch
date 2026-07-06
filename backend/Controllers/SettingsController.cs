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
            IsConfigured(configuration["Smtp:Host"]) && IsConfigured(configuration["Smtp:To"]),
            IsConfigured(configuration["OpenAI:ApiKey"]),
            IsConfigured(configuration["AbuseIPDB:ApiKey"]),
            IsConfigured(configuration["VirusTotal:ApiKey"]),
            IsConfigured(configuration["Shodan:ApiKey"]),
            IsConfigured(configuration["Otx:ApiKey"]),
            IsConfigured(configuration["Nvd:ApiKey"]),
            5,
            recentAlerts,
            failedAlerts));
    }

    private static bool IsConfigured(string? value) =>
        !string.IsNullOrWhiteSpace(value) &&
        !value.Contains("your_key_here", StringComparison.OrdinalIgnoreCase) &&
        !value.Contains("replace_with", StringComparison.OrdinalIgnoreCase);
}
