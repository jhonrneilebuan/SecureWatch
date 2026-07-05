using System.Net.Http.Json;
using System.Net;
using System.Net.Mail;
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
            try
            {
                var client = httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("Key", apiKey);
                client.DefaultRequestHeaders.Add("Accept", "application/json");
                var response = await client.GetAsync($"https://api.abuseipdb.com/api/v2/check?ipAddress={Uri.EscapeDataString(ipAddress)}&maxAgeInDays=90", cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
                    var data = doc.RootElement.GetProperty("data");
                    entity.AbuseConfidenceScore = data.GetProperty("abuseConfidenceScore").GetInt32();
                    entity.CountryCode = data.TryGetProperty("countryCode", out var country) ? country.GetString() ?? string.Empty : string.Empty;
                    entity.Isp = data.TryGetProperty("isp", out var isp) ? isp.GetString() ?? string.Empty : string.Empty;
                    entity.TotalReports = data.TryGetProperty("totalReports", out var reports) ? reports.GetInt32() : 0;
                    entity.IsMalicious = entity.AbuseConfidenceScore >= 75 || entity.TotalReports >= 10;
                }
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
            {
                entity.Isp = "Lookup unavailable";
            }
        }

        await dbContext.IpReputations.AddAsync(entity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new IpReputationDto(entity.Id, entity.IpAddress, entity.AbuseConfidenceScore, entity.CountryCode, entity.Isp, entity.TotalReports, entity.IsMalicious, entity.CheckedAt);
    }
}

public sealed class CveLookupService(AppDbContext dbContext, IHttpClientFactory httpClientFactory, IConfiguration configuration) : ICveLookupService
{
    public async Task<IReadOnlyCollection<CveRecordDto>> SearchAsync(string query, CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient();
        var url = $"https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch={Uri.EscapeDataString(query)}";
        var apiKey = configuration["Nvd:ApiKey"];
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            client.DefaultRequestHeaders.Add("apiKey", apiKey);
        }

        using var response = await client.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));

        var records = new List<CveRecord>();
        if (!doc.RootElement.TryGetProperty("vulnerabilities", out var vulnerabilities))
        {
            return [];
        }

        foreach (var item in vulnerabilities.EnumerateArray().Take(20))
        {
            var cve = item.GetProperty("cve");
            var cveId = cve.GetProperty("id").GetString() ?? string.Empty;
            var description = cve.TryGetProperty("descriptions", out var descriptions)
                ? descriptions.EnumerateArray()
                    .FirstOrDefault(x => x.TryGetProperty("lang", out var lang) && lang.GetString() == "en")
                    .TryGetProperty("value", out var value) ? value.GetString() ?? string.Empty : string.Empty
                : string.Empty;
            var (severity, score) = ExtractCvss(cve);

            var referenceUrl = string.Empty;
            if (cve.TryGetProperty("references", out var references) &&
                references.ValueKind == JsonValueKind.Array)
            {
                var firstReference = references.EnumerateArray().FirstOrDefault();
                referenceUrl = firstReference.ValueKind != JsonValueKind.Undefined &&
                    firstReference.TryGetProperty("url", out var referenceUrlElement)
                    ? referenceUrlElement.GetString() ?? string.Empty
                    : string.Empty;
            }
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

    private static (string Severity, decimal? Score) ExtractCvss(JsonElement cve)
    {
        if (!cve.TryGetProperty("metrics", out var metrics) || metrics.ValueKind != JsonValueKind.Object)
        {
            return ("Unknown", null);
        }

        foreach (var metricName in new[] { "cvssMetricV31", "cvssMetricV30", "cvssMetricV2" })
        {
            if (!metrics.TryGetProperty(metricName, out var metricArray) || metricArray.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            var metric = metricArray.EnumerateArray().FirstOrDefault();
            if (metric.ValueKind == JsonValueKind.Undefined || !metric.TryGetProperty("cvssData", out var cvssData))
            {
                continue;
            }

            var severity = cvssData.TryGetProperty("baseSeverity", out var baseSeverity)
                ? baseSeverity.GetString() ?? "Unknown"
                : metric.TryGetProperty("baseSeverity", out var metricSeverity)
                    ? metricSeverity.GetString() ?? "Unknown"
                    : "Unknown";
            var score = cvssData.TryGetProperty("baseScore", out var baseScore) && baseScore.TryGetDecimal(out var value)
                ? value
                : (decimal?)null;

            return (severity, score);
        }

        return ("Unknown", null);
    }
}

public sealed class AiRecommendationService(IHttpClientFactory httpClientFactory, IConfiguration configuration) : IAiRecommendationService
{
    public async Task<AiRecommendationResponse> GenerateAsync(AiRecommendationRequest request, CancellationToken cancellationToken)
    {
        var apiKey = configuration["OpenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return CreateFallbackRecommendation(request);
        }

        try
        {
            var client = httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new("Bearer", apiKey);
            var prompt = $$"""
Return concise SOC guidance as strict JSON with keys:
threatExplanation, possibleImpact, recommendedActions, preventionSteps.
Threat={{request.ThreatType}}, severity={{request.Severity}}, ip={{request.SourceIp}}, failedAttempts={{request.FailedAttempts}}, riskScore={{request.RiskScore}}.
""";
            var payload = new
            {
                model = configuration["OpenAI:Model"] ?? "gpt-4o-mini",
                response_format = new { type = "json_object" },
                messages = new[] { new { role = "user", content = prompt } }
            };
            using var response = await SendWithRetryAsync(client, payload, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return CreateFallbackRecommendation(request);
            }

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? string.Empty;
            return ParseStructuredRecommendation(content) ?? CreateFallbackRecommendation(request);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            return CreateFallbackRecommendation(request);
        }
    }

    private static async Task<HttpResponseMessage> SendWithRetryAsync(HttpClient client, object payload, CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 3; attempt++)
        {
            var response = await client.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", payload, cancellationToken);
            if ((int)response.StatusCode is not (429 or >= 500) || attempt == 2)
            {
                return response;
            }

            response.Dispose();
            await Task.Delay(TimeSpan.FromMilliseconds(400 * (attempt + 1)), cancellationToken);
        }

        throw new InvalidOperationException("OpenAI retry loop exited unexpectedly.");
    }

    private static AiRecommendationResponse? ParseStructuredRecommendation(string content)
    {
        try
        {
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;
            return new AiRecommendationResponse(
                root.GetProperty("threatExplanation").GetString() ?? string.Empty,
                root.GetProperty("possibleImpact").GetString() ?? string.Empty,
                root.GetProperty("recommendedActions").GetString() ?? string.Empty,
                root.GetProperty("preventionSteps").GetString() ?? string.Empty);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static AiRecommendationResponse CreateFallbackRecommendation(AiRecommendationRequest request)
    {
        return new AiRecommendationResponse(
            $"{request.ThreatType} activity was detected from {request.SourceIp} with {request.FailedAttempts} failed attempts.",
            "The activity may indicate credential stuffing, account takeover attempts, or reconnaissance against authentication systems.",
            "Block or rate-limit the source IP, enable MFA, reset affected credentials, and review related authentication events.",
            "Use account lockout policies, MFA, IP allowlists for admin portals, alerting thresholds, and continuous log review.");
    }
}

public sealed class EmailAlertService(IConfiguration configuration, ILogger<EmailAlertService> logger, AppDbContext dbContext) : IEmailAlertService
{
    public async Task SendThreatAlertAsync(Threat threat, Incident? incident, CancellationToken cancellationToken)
    {
        var host = configuration["Smtp:Host"];
        var username = configuration["Smtp:Username"];
        var password = configuration["Smtp:Password"];
        var from = configuration["Smtp:From"];
        var to = configuration["Smtp:To"];
        var port = int.TryParse(configuration["Smtp:Port"], out var configuredPort) ? configuredPort : 587;

        if (string.IsNullOrWhiteSpace(host) ||
            string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password) ||
            string.IsNullOrWhiteSpace(from) ||
            string.IsNullOrWhiteSpace(to))
        {
            logger.LogInformation("SMTP is not fully configured. Skipping alert for threat {ThreatId}", threat.Id);
            await RecordEmailAlertAsync(threat.Id, to ?? string.Empty, $"SecureWatch {threat.Severity} Alert: {threat.ThreatType}", EmailAlertStatus.Skipped, "SMTP is not fully configured.", cancellationToken);
            return;
        }

        var subject = $"SecureWatch {threat.Severity} Alert: {threat.ThreatType}";
        using var message = new MailMessage
        {
            From = new MailAddress(from, "SecureWatch Alerts"),
            Subject = subject,
            Body = BuildThreatAlertBody(threat, incident),
            IsBodyHtml = false
        };

        foreach (var recipient in to.Split([';', ','], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            message.To.Add(recipient);
        }

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(username, password)
        };

        try
        {
            await client.SendMailAsync(message, cancellationToken);
            await RecordEmailAlertAsync(threat.Id, to, subject, EmailAlertStatus.Sent, string.Empty, cancellationToken);
            logger.LogInformation("SMTP alert sent for threat {ThreatId} to {Recipients}", threat.Id, to);
        }
        catch (Exception ex) when (ex is SmtpException or InvalidOperationException)
        {
            await RecordEmailAlertAsync(threat.Id, to, subject, EmailAlertStatus.Failed, ex.Message, cancellationToken);
            logger.LogError(ex, "SMTP alert failed for threat {ThreatId}. Check SMTP host, port, username, app password, and sender permissions.", threat.Id);
        }
    }

    private async Task RecordEmailAlertAsync(Guid threatId, string recipients, string subject, EmailAlertStatus status, string error, CancellationToken cancellationToken)
    {
        await dbContext.EmailAlerts.AddAsync(new EmailAlert
        {
            Id = Guid.NewGuid(),
            ThreatId = threatId,
            Recipients = recipients,
            Subject = subject,
            Status = status,
            ErrorMessage = error
        }, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static string BuildThreatAlertBody(Threat threat, Incident? incident)
    {
        var incidentLine = incident is null
            ? "Incident: Not created"
            : $"Incident: {incident.Title} ({incident.Status})";

        return $"""
SecureWatch Security Alert

Threat Type: {threat.ThreatType}
Severity: {threat.Severity}
Source IP: {threat.SourceIP}
Failed Attempts: {threat.FailedAttempts}
Risk Score: {threat.RiskScore}
{incidentLine}

Description:
{threat.Description}

Recommended Actions:
{threat.Recommendation}

Possible Impact:
{threat.AiImpact ?? "Review affected systems and authentication activity."}

Prevention Steps:
{threat.AiPreventionSteps ?? "Enable MFA, enforce lockout thresholds, and monitor repeated authentication failures."}

Dashboard:
http://localhost:3000/incidents
""";
    }
}

public sealed class ReportService(AppDbContext dbContext) : IReportService
{
    public async Task<(byte[] Content, string FileName)> GenerateSecurityReportAsync(Guid userId, CancellationToken cancellationToken)
    {
        var logs = await dbContext.SecurityLogs.CountAsync(cancellationToken);
        var threats = await dbContext.Threats.CountAsync(cancellationToken);
        var openIncidents = await dbContext.Incidents.CountAsync(x => x.Status != IncidentStatus.Resolved, cancellationToken);
        var resolvedIncidents = await dbContext.Incidents.CountAsync(x => x.Status == IncidentStatus.Resolved, cancellationToken);
        var highRiskThreats = await dbContext.Threats.CountAsync(x => x.Severity == ThreatSeverity.High || x.Severity == ThreatSeverity.Critical, cancellationToken);
        var failedLogins = await dbContext.SecurityLogs.SumAsync(x => x.FailedLoginAttempts, cancellationToken);
        var sentAlerts = await dbContext.EmailAlerts.CountAsync(x => x.Status == EmailAlertStatus.Sent, cancellationToken);
        var failedAlerts = await dbContext.EmailAlerts.CountAsync(x => x.Status == EmailAlertStatus.Failed, cancellationToken);
        var topIps = await dbContext.Threats
            .AsNoTracking()
            .Where(x => !string.IsNullOrWhiteSpace(x.SourceIP))
            .GroupBy(x => x.SourceIP)
            .Select(x => new { Ip = x.Key, Count = x.Count(), MaxRisk = x.Max(t => t.RiskScore) })
            .OrderByDescending(x => x.MaxRisk)
            .ThenByDescending(x => x.Count)
            .Take(5)
            .ToListAsync(cancellationToken);
        var recentThreats = await dbContext.Threats
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(5)
            .Select(x => new { x.ThreatType, x.Severity, x.SourceIP, x.RiskScore, x.CreatedAt })
            .ToListAsync(cancellationToken);

        var lines = new List<string>
        {
            "SecureWatch Security Report",
            $"Generated: {DateTimeOffset.UtcNow:u}",
            "",
            "Executive Summary",
            highRiskThreats > 0
                ? $"High-risk activity is present. {highRiskThreats} high or critical threats should be reviewed first."
                : "No high or critical threats are currently recorded.",
            $"Open incidents: {openIncidents}. Resolved incidents: {resolvedIncidents}. SMTP alerts sent: {sentAlerts}, failed: {failedAlerts}.",
            "",
            "Dashboard Metrics",
            $"Total logs analyzed: {logs}",
            $"Threats detected: {threats}",
            $"High-risk threats: {highRiskThreats}",
            $"Failed login attempts from uploaded logs: {failedLogins}",
            "",
            "Top Risk Source IPs"
        };

        lines.AddRange(topIps.Count == 0
            ? ["No source IPs recorded yet."]
            : topIps.Select(x => $"{x.Ip} - {x.Count} threat(s), max risk {x.MaxRisk}"));

        lines.Add("");
        lines.Add("Recent Threats");
        lines.AddRange(recentThreats.Count == 0
            ? ["No threats recorded yet."]
            : recentThreats.Select(x => $"{x.CreatedAt:u} - {x.ThreatType} - {x.Severity} - {x.SourceIP} - risk {x.RiskScore}"));

        lines.Add("");
        lines.Add("Recommended Actions");
        lines.Add("1. Investigate high and critical incidents first.");
        lines.Add("2. Block or rate-limit repeat attacking IPs.");
        lines.Add("3. Enforce MFA and account lockout on exposed login surfaces.");
        lines.Add("4. Review failed SMTP alerts so security notifications are not missed.");

        var summary = string.Join('\n', lines);
        await dbContext.Reports.AddAsync(new Report
        {
            Id = Guid.NewGuid(),
            ReportType = "Security Summary",
            ExecutiveSummary = summary,
            GeneratedBy = userId
        }, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return (CreateSimplePdf(lines), $"securewatch-report-{DateTimeOffset.UtcNow:yyyyMMddHHmm}.pdf");
    }

    private static byte[] CreateSimplePdf(IEnumerable<string> lines)
    {
        var escapedLines = lines.Select(line => line.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)").Replace("\r", string.Empty));
        var body = $"BT /F1 11 Tf 50 760 Td 14 TL ({string.Join(") Tj T* (", escapedLines)}) Tj ET";
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
