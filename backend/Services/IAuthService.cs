using SecureWatch.Api.DTOs;

namespace SecureWatch.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task RecordLogoutAsync(Guid userId, string ipAddress, CancellationToken cancellationToken);
}
