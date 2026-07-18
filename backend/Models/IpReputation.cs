namespace SecureWatch.Api.Models;

public sealed class IpReputation
{
    public Guid Id { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public int AbuseConfidenceScore { get; set; }
    public string CountryCode { get; set; } = string.Empty;
    public string Isp { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public int TotalReports { get; set; }
    public bool IsMalicious { get; set; }
    public DateTimeOffset CheckedAt { get; set; } = DateTimeOffset.UtcNow;
}
