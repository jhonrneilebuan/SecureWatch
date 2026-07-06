namespace SecureWatch.Api.DTOs;

public sealed record PagedResult<T>(
    IReadOnlyCollection<T> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);

public sealed record NotificationDto(
    Guid Id,
    string Title,
    string Message,
    string Severity,
    string EntityType,
    Guid? EntityId,
    bool IsRead,
    DateTimeOffset CreatedAt);
