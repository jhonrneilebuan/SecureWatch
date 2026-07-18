namespace SecureWatch.Api.DTOs;

public sealed record IpReputationDto(
    Guid Id,
    string IpAddress,
    int AbuseConfidenceScore,
    string CountryCode,
    string Isp,
    int TotalReports,
    bool IsMalicious,
    DateTimeOffset CheckedAt,
    double? Latitude = null,
    double? Longitude = null);

public sealed record CveRecordDto(
    Guid Id,
    string Query,
    string CveId,
    string Severity,
    decimal? CvssScore,
    string Description,
    DateTimeOffset? PublishedDate,
    string ReferenceUrl);

public sealed record EmailAlertDto(
    Guid Id,
    Guid? ThreatId,
    string Recipients,
    string Subject,
    string Status,
    string ErrorMessage,
    DateTimeOffset CreatedAt);

public sealed record SystemStatusDto(
    bool SmtpConfigured,
    bool OpenAiConfigured,
    bool AbuseIpDbConfigured,
    bool VirusTotalConfigured,
    bool ShodanConfigured,
    bool OtxConfigured,
    bool NvdConfigured,
    int FailedLoginLockoutThreshold,
    int RecentEmailAlerts,
    int FailedEmailAlerts);
