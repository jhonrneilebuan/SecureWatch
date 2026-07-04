using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecureWatch.Api.Services;
using System.Security.Claims;

namespace SecureWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public sealed class ReportsController(IReportService reportService) : ControllerBase
{
    [HttpGet("security-summary.pdf")]
    public async Task<IActionResult> Export(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var report = await reportService.GenerateSecurityReportAsync(userId, cancellationToken);
        return File(report.Content, "application/pdf", report.FileName);
    }
}
