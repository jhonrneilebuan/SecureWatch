using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Data;
using SecureWatch.Api.DTOs;

namespace SecureWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Analyst")]
public sealed class NotificationsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<NotificationDto>>> GetAll([FromQuery] bool unreadOnly = false, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Notifications.AsNoTracking();
        if (unreadOnly)
        {
            query = query.Where(x => !x.IsRead);
        }

        var notifications = await query
            .OrderByDescending(x => x.CreatedAt)
            .Take(25)
            .Select(x => new NotificationDto(x.Id, x.Title, x.Message, x.Severity.ToString(), x.EntityType, x.EntityId, x.IsRead, x.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(notifications);
    }

    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken cancellationToken)
    {
        var notification = await dbContext.Notifications.FindAsync([id], cancellationToken);
        if (notification is null)
        {
            return NotFound();
        }

        notification.IsRead = true;
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
