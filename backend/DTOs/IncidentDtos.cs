using SecureWatch.Api.Models;

namespace SecureWatch.Api.DTOs;

public sealed record IncidentDto(
    Guid Id,
    Guid ThreatId,
    string Title,
    string Description,
    IncidentPriority Priority,
    IncidentStatus Status,
    Guid? AssignedTo,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? ResolvedAt);

public sealed record CreateIncidentRequest(Guid ThreatId, string Title, string Description, IncidentPriority Priority, Guid? AssignedTo);
public sealed record UpdateIncidentRequest(IncidentStatus Status, Guid? AssignedTo);
public sealed record AddIncidentNoteRequest(string Note);
