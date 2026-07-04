using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Data;
using SecureWatch.Api.Services;

namespace SecureWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class LogsController(AppDbContext dbContext, ILogAnalysisService logAnalysisService) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Ok(await dbContext.SecurityLogs.AsNoTracking().OrderByDescending(x => x.UploadedAt).ToListAsync(cancellationToken));

    [HttpPost("upload")]
    [Authorize(Roles = "Admin,Analyst")]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
        {
            return BadRequest(new { error = "A non-empty log file is required." });
        }

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await logAnalysisService.UploadAndAnalyzeAsync(file, userId, cancellationToken);
        return Ok(result);
    }
}
