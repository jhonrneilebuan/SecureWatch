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
public sealed class IncidentsController(AppDbContext dbContext, IWebHostEnvironment environment) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 5, 100);
        var query = dbContext.Incidents.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.Title.Contains(search) || x.Description.Contains(search));
        }

        if (Enum.TryParse<IncidentStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(x => x.Status == parsedStatus);
        }

        var total = await query.CountAsync(cancellationToken);
        var incidents = await query.OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new IncidentDto(x.Id, x.ThreatId, x.Title, x.Description, x.Priority, x.Status, x.AssignedTo, x.ResolutionNotes, x.CreatedAt, x.UpdatedAt, x.ResolvedAt))
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<IncidentDto>(incidents, page, pageSize, total, (int)Math.Ceiling(total / (double)pageSize)));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var incident = await dbContext.Incidents.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (incident is null) return NotFound();

        var notes = await dbContext.IncidentNotes.AsNoTracking()
            .Where(x => x.IncidentId == id)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
        var evidence = await dbContext.IncidentEvidence.AsNoTracking()
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
            incident.ResolutionNotes,
            incident.CreatedAt,
            incident.UpdatedAt,
            incident.ResolvedAt,
            Notes = notes,
            Evidence = evidence,
            Timeline = notes.Select(x => new { Type = "Note", Message = x.Note, x.CreatedAt })
                .Concat(evidence.Select(x => new { Type = "Evidence", Message = $"{x.Title}: {x.Reference}", x.CreatedAt }))
                .OrderByDescending(x => x.CreatedAt)
                .ToList()
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
            incident.ResolutionNotes = request.ResolutionNotes?.Trim() ?? incident.ResolutionNotes;
        }
        else
        {
            incident.ResolutionNotes = request.ResolutionNotes?.Trim() ?? incident.ResolutionNotes;
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

    [HttpPost("{id:guid}/evidence")]
    public async Task<IActionResult> AddEvidence(Guid id, AddIncidentEvidenceRequest request, CancellationToken cancellationToken)
    {
        if (!await dbContext.Incidents.AnyAsync(x => x.Id == id, cancellationToken)) return NotFound();
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Reference))
        {
            return BadRequest("Evidence title and reference are required.");
        }

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var evidence = new IncidentEvidence
        {
            Id = Guid.NewGuid(),
            IncidentId = id,
            AddedBy = userId,
            Title = request.Title.Trim(),
            EvidenceType = string.IsNullOrWhiteSpace(request.EvidenceType) ? "Reference" : request.EvidenceType.Trim(),
            Reference = request.Reference.Trim()
        };
        await dbContext.IncidentEvidence.AddAsync(evidence, cancellationToken);
        await AuditAsync("Incident evidence added", id, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(evidence);
    }

    [HttpPost("{id:guid}/evidence-file")]
    public async Task<IActionResult> AddEvidenceFile(Guid id, IFormFile file, [FromForm] string? title, CancellationToken cancellationToken)
    {
        if (!await dbContext.Incidents.AnyAsync(x => x.Id == id, cancellationToken)) return NotFound();
        if (file.Length is <= 0 or > 10 * 1024 * 1024)
        {
            return BadRequest("Evidence file must be non-empty and 10 MB or smaller.");
        }

        var allowedExtensions = new[] { ".log", ".txt", ".csv", ".json", ".png", ".jpg", ".jpeg", ".pdf" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest("Evidence file type is not allowed.");
        }

        var evidenceRoot = Path.Combine(environment.ContentRootPath, "App_Data", "incident-evidence", id.ToString());
        Directory.CreateDirectory(evidenceRoot);
        var storedName = $"{Guid.NewGuid():N}{extension}";
        var storedPath = Path.Combine(evidenceRoot, storedName);
        await using (var stream = System.IO.File.Create(storedPath))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var evidence = new IncidentEvidence
        {
            Id = Guid.NewGuid(),
            IncidentId = id,
            AddedBy = userId,
            Title = string.IsNullOrWhiteSpace(title) ? file.FileName : title.Trim(),
            EvidenceType = "File",
            Reference = Path.Combine("App_Data", "incident-evidence", id.ToString(), storedName)
        };
        await dbContext.IncidentEvidence.AddAsync(evidence, cancellationToken);
        await AuditAsync("Incident evidence file added", id, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(evidence);
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
