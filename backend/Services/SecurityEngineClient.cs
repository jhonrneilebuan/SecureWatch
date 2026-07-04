using System.Net.Http.Headers;
using System.Net.Http.Json;
using SecureWatch.Api.DTOs;

namespace SecureWatch.Api.Services;

public interface ISecurityEngineClient
{
    Task<SecurityEngineResult> AnalyzeLogAsync(IFormFile file, CancellationToken cancellationToken);
}

public sealed class SecurityEngineClient(HttpClient httpClient) : ISecurityEngineClient
{
    public async Task<SecurityEngineResult> AnalyzeLogAsync(IFormFile file, CancellationToken cancellationToken)
    {
        using var content = new MultipartFormDataContent();
        await using var stream = file.OpenReadStream();
        var fileContent = new StreamContent(stream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType.Length > 0 ? file.ContentType : "text/plain");
        content.Add(fileContent, "file", file.FileName);

        var response = await httpClient.PostAsync("/analyze-log", content, cancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<SecurityEngineResult>(cancellationToken: cancellationToken)
            ?? new SecurityEngineResult(false, null, null, null, 0, 0, 0, [], null, null);
    }
}
