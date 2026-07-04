using SecureWatch.Api.DTOs;

namespace SecureWatch.Api.Services;

public interface ILogAnalysisService
{
    Task<SecurityEngineResult> UploadAndAnalyzeAsync(IFormFile file, Guid userId, CancellationToken cancellationToken);
}
