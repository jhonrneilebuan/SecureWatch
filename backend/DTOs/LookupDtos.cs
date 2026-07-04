namespace SecureWatch.Api.DTOs;

public sealed record IpReputationDto(
    Guid Id,
    string IpAddress,
    int AbuseConfidenceScore,
    string CountryCode,
    string Isp,
    int TotalReports,
    bool IsMalicious,
    DateTimeOffset CheckedAt);

public sealed record CveRecordDto(
    Guid Id,
    string Query,
    string CveId,
    string Severity,
    decimal? CvssScore,
    string Description,
    DateTimeOffset? PublishedDate,
    string ReferenceUrl);
