using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Data;
using SecureWatch.Api.DTOs;
using SecureWatch.Api.Models;

namespace SecureWatch.Api.Services;

public interface IIpReputationService
{
    Task<IpReputationDto> CheckAsync(string ipAddress, CancellationToken cancellationToken);
}

public interface ICveLookupService
{
    Task<IReadOnlyCollection<CveRecordDto>> SearchAsync(string query, CancellationToken cancellationToken);
}

public interface IAiRecommendationService
{
    Task<AiRecommendationResponse> GenerateAsync(AiRecommendationRequest request, CancellationToken cancellationToken);
}

public interface IEmailAlertService
{
    Task SendThreatAlertAsync(Threat threat, Incident? incident, CancellationToken cancellationToken);
}

public interface IReportService
{
    Task<(byte[] Content, string FileName)> GenerateSecurityReportAsync(Guid userId, CancellationToken cancellationToken);
}

public sealed class IpReputationService(AppDbContext dbContext, IHttpClientFactory httpClientFactory, IConfiguration configuration) : IIpReputationService
{
    public async Task<IpReputationDto> CheckAsync(string ipAddress, CancellationToken cancellationToken)
    {
        var apiKey = configuration["AbuseIPDB:ApiKey"];
        var entity = new IpReputation
        {
            Id = Guid.NewGuid(),
            IpAddress = ipAddress,
            CheckedAt = DateTimeOffset.UtcNow
        };

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            var client = httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("Key", apiKey);
            client.DefaultRequestHeaders.Add("Accept", "application/json");
            var response = await client.GetAsync($"https://api.abuseipdb.com/api/v2/check?ipAddress={Uri.EscapeDataString(ipAddress)}&maxAgeInDays=90", cancellationToken);
            response.EnsureSuccessStatusCode();
            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            var data = doc.RootElement.GetProperty("data");
            entity.AbuseConfidenceScore = data.GetProperty("abuseConfidenceScore").GetInt32();
            entity.CountryCode = data.TryGetProperty("countryCode", out var country) ? country.GetString() ?? string.Empty : string.Empty;
            entity.Isp = data.TryGetProperty("isp", out var isp) ? isp.GetString() ?? string.Empty : string.Empty;
            entity.TotalReports = data.TryGetProperty("totalReports", out var reports) ? reports.GetInt32() : 0;
            entity.IsMalicious = entity.AbuseConfidenceScore >= 75 || entity.TotalReports >= 10;
        }

        await dbContext.IpReputations.AddAsync(entity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new IpReputationDto(entity.Id, entity.IpAddress, entity.AbuseConfidenceScore, entity.CountryCode, entity.Isp, entity.TotalReports, entity.IsMalicious, entity.CheckedAt);
    }
}

public sealed class CveLookupService(AppDbContext dbContext, IHttpClientFactory httpClientFactory) : ICveLookupService
{
    public async Task<IReadOnlyCollection<CveRecordDto>> SearchAsync(string query, CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient();
        var url = $"https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch={Uri.EscapeDataString(query)}";
        using var response = await client.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));

        var records = new List<CveRecord>();
        foreach (var item in doc.RootElement.GetProperty("vulnerabilities").EnumerateArray().Take(10))
        {
            var cve = item.GetProperty("cve");
            var cveId = cve.GetProperty("id").GetString() ?? string.Empty;
            var description = cve.GetProperty("descriptions").EnumerateArray()
                .FirstOrDefault(x => x.GetProperty("lang").GetString() == "en")
                .GetProperty("value").GetString() ?? string.Empty;
            var metrics = cve.TryGetProperty("metrics", out var m) ? m : default;
            var severity = "Unknown";
            decimal? score = null;
            if (metrics.ValueKind != JsonValueKind.Undefined && metrics.TryGetProperty("cvssMetricV31", out var cvss31))
            {
                var cvssData = cvss31[0].GetProperty("cvssData");
                severity = cvssData.GetProperty("baseSeverity").GetString() ?? severity;
                score = cvssData.GetProperty("baseScore").GetDecimal();
            }

            var referenceUrl = cve.GetProperty("references").GetProperty("referenceData").EnumerateArray().FirstOrDefault().GetProperty("url").GetString() ?? string.Empty;
            records.Add(new CveRecord
            {
                Id = Guid.NewGuid(),
                Query = query,
                CveId = cveId,
                Description = description,
                Severity = severity,
                CvssScore = score,
                PublishedDate = DateTimeOffset.TryParse(cve.GetProperty("published").GetString(), out var published) ? published.ToUniversalTime() : null,
                ReferenceUrl = referenceUrl
            });
        }

        await dbContext.CveRecords.AddRangeAsync(records, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return records.Select(x => new CveRecordDto(x.Id, x.Query, x.CveId, x.Severity, x.CvssScore, x.Description, x.PublishedDate, x.ReferenceUrl)).ToList();
    }
}

public sealed class AiRecommendationService(IHttpClientFactory httpClientFactory, IConfiguration configuration) : IAiRecommendationService
{
    public async Task<AiRecommendationResponse> GenerateAsync(AiRecommendationRequest request, CancellationToken cancellationToken)
    {
        var apiKey = configuration["OpenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return new AiRecommendationResponse(
                $"{request.ThreatType} activity was detected from {request.SourceIp} with {request.FailedAttempts} failed attempts.",
                "The activity may indicate credential stuffing, account takeover attempts, or reconnaissance against authentication systems.",
                "Block or rate-limit the source IP, enable MFA, reset affected credentials, and review related authentication events.",
                "Use account lockout policies, MFA, IP allowlists for admin portals, alerting thresholds, and continuous log review.");
        }

        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", apiKey);
        var prompt = $"Create concise SOC guidance for threat={request.ThreatType}, severity={request.Severity}, ip={request.SourceIp}, failedAttempts={request.FailedAttempts}, riskScore={request.RiskScore}.";
        var payload = new
        {
            model = configuration["OpenAI:Model"] ?? "gpt-4o-mini",
            messages = new[] { new { role = "user", content = prompt } }
        };
        using var response = await client.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", payload, cancellationToken);
        response.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? string.Empty;
        return new AiRecommendationResponse(content, content, content, content);
    }
}

public sealed class EmailAlertService(IConfiguration configuration, ILogger<EmailAlertService> logger) : IEmailAlertService
{
    public Task SendThreatAlertAsync(Threat threat, Incident? incident, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(configuration["Smtp:Host"]))
        {
            logger.LogInformation("SMTP is not configured. Skipping alert for threat {ThreatId}", threat.Id);
            return Task.CompletedTask;
        }

        logger.LogInformation("SMTP settings detected. Email alert would be sent for {ThreatType} {Severity}", threat.ThreatType, threat.Severity);
        return Task.CompletedTask;
    }
}

public sealed class ReportService(AppDbContext dbContext) : IReportService
{
    public async Task<(byte[] Content, string FileName)> GenerateSecurityReportAsync(Guid userId, CancellationToken cancellationToken)
    {
        var logs = await dbContext.SecurityLogs.CountAsync(cancellationToken);
        var threats = await dbContext.Threats.CountAsync(cancellationToken);
        var incidents = await dbContext.Incidents.CountAsync(cancellationToken);
        var summary = $"SecureWatch Security Report\nGenerated: {DateTimeOffset.UtcNow:u}\nTotal logs analyzed: {logs}\nThreats detected: {threats}\nIncidents: {incidents}\nExecutive summary: Review high-risk threats, investigate active incidents, and enforce MFA on exposed accounts.";
        await dbContext.Reports.AddAsync(new Report
        {
            Id = Guid.NewGuid(),
            ReportType = "Security Summary",
            ExecutiveSummary = summary,
            GeneratedBy = userId
        }, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return (CreateSimplePdf(summary), $"securewatch-report-{DateTimeOffset.UtcNow:yyyyMMddHHmm}.pdf");
    }

    private static byte[] CreateSimplePdf(string text)
    {
        var escaped = text.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)").Replace("\r", string.Empty).Replace("\n", ") Tj T* (");
        var body = $"BT /F1 12 Tf 50 760 Td ({escaped}) Tj ET";
        var pdf = "%PDF-1.4\n" +
                  "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n" +
                  "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n" +
                  "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n" +
                  "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n" +
                  $"5 0 obj << /Length {body.Length} >> stream\n{body}\nendstream endobj\n" +
                  "trailer << /Root 1 0 R >>\n%%EOF\n";
        return Encoding.ASCII.GetBytes(pdf);
    }
}
