using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Data;
using SecureWatch.Api.DTOs;
using SecureWatch.Api.Models;
using System.Security.Claims;

namespace SecureWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Analyst")]
public sealed class IncidentsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Ok(await dbContext.Incidents.AsNoTracking().OrderByDescending(x => x.CreatedAt)
            .Select(x => new IncidentDto(x.Id, x.ThreatId, x.Title, x.Description, x.Priority, x.Status, x.AssignedTo, x.CreatedAt, x.UpdatedAt, x.ResolvedAt))
            .ToListAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var incident = await dbContext.Incidents.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (incident is null) return NotFound();

        var notes = await dbContext.IncidentNotes.AsNoTracking()
            .Where(x => x.IncidentId == id)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            incident.Id,
            incident.ThreatId,
            incident.Title,
            incident.Description,
            Priority = incident.Priority.ToString(),
            Status = incident.Status.ToString(),
            incident.AssignedTo,
            incident.CreatedAt,
            incident.UpdatedAt,
            incident.ResolvedAt,
            Notes = notes
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateIncidentRequest request, CancellationToken cancellationToken)
    {
        var incident = new Incident
        {
            Id = Guid.NewGuid(),
            ThreatId = request.ThreatId,
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            AssignedTo = request.AssignedTo
        };
        await dbContext.Incidents.AddAsync(incident, cancellationToken);
        await AuditAsync("Incident created", incident.Id, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(incident);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateIncidentRequest request, CancellationToken cancellationToken)
    {
        var incident = await dbContext.Incidents.FindAsync([id], cancellationToken);
        if (incident is null) return NotFound();
        incident.Status = request.Status;
        incident.AssignedTo = request.AssignedTo;
        incident.UpdatedAt = DateTimeOffset.UtcNow;
        if (request.Status is IncidentStatus.Resolved or IncidentStatus.Closed)
        {
            incident.ResolvedAt = DateTimeOffset.UtcNow;
        }
        await AuditAsync("Incident updated", incident.Id, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(incident);
    }

    [HttpPost("{id:guid}/notes")]
    public async Task<IActionResult> AddNote(Guid id, AddIncidentNoteRequest request, CancellationToken cancellationToken)
    {
        if (!await dbContext.Incidents.AnyAsync(x => x.Id == id, cancellationToken)) return NotFound();
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var note = new IncidentNote { Id = Guid.NewGuid(), IncidentId = id, UserId = userId, Note = request.Note };
        await dbContext.IncidentNotes.AddAsync(note, cancellationToken);
        await AuditAsync("Incident note added", id, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(note);
    }

    private Task AuditAsync(string action, Guid entityId, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return dbContext.AuditLogs.AddAsync(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = action,
            EntityType = nameof(Incident),
            EntityId = entityId,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty
        }, cancellationToken).AsTask();
    }
}
