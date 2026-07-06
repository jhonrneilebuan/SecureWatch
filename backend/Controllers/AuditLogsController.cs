using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Data;
using SecureWatch.Api.DTOs;

namespace SecureWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public sealed class AuditLogsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? action, [FromQuery] DateTimeOffset? date, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 5, 100);
        var query = dbContext.AuditLogs.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.Action.Contains(search) || x.EntityType.Contains(search) || x.IpAddress.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(x => x.Action == action);
        }

        if (date is not null)
        {
            var start = date.Value.Date;
            var end = start.AddDays(1);
            query = query.Where(x => x.Timestamp >= start && x.Timestamp < end);
        }

        var total = await query.CountAsync(cancellationToken);
        var logs = await query.OrderByDescending(x => x.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return Ok(new PagedResult<SecureWatch.Api.Models.AuditLog>(logs, page, pageSize, total, (int)Math.Ceiling(total / (double)pageSize)));
    }
}
