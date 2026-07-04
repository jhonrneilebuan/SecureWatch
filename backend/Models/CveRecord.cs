namespace SecureWatch.Api.Models;

public sealed class CveRecord
{
    public Guid Id { get; set; }
    public string Query { get; set; } = string.Empty;
    public string CveId { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public decimal? CvssScore { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTimeOffset? PublishedDate { get; set; }
    public string ReferenceUrl { get; set; } = string.Empty;
    public DateTimeOffset SearchedAt { get; set; } = DateTimeOffset.UtcNow;
}
