using System;
using System.IO;
using System.Text.Json;
using System.Linq;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        Console.WriteLine("Running JSON parse test on nvd_response.json...");
        try
        {
            var json = File.ReadAllText(@"c:\Users\jhonr\Desktop\SecureWatch\nvd_response.json");
            using var doc = JsonDocument.Parse(json);
            
            if (!doc.RootElement.TryGetProperty("vulnerabilities", out var vulnerabilities))
            {
                Console.WriteLine("No vulnerabilities key found!");
                return;
            }

            int index = 0;
            foreach (var item in vulnerabilities.EnumerateArray())
            {
                var cve = item.GetProperty("cve");
                var cveId = cve.GetProperty("id").GetString() ?? string.Empty;
                Console.WriteLine($"Parsing item {index}: {cveId}");

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
                index++;
            }
            Console.WriteLine("Success! All parsed correctly.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
        }
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
