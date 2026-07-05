using SecureWatch.Api.DTOs;

namespace SecureWatch.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<AuthResponse> LoginAsync(LoginRequest request, string ipAddress, CancellationToken cancellationToken);
    Task<AuthResponse> RefreshAsync(RefreshTokenRequest request, string ipAddress, CancellationToken cancellationToken);
    Task RecordLogoutAsync(Guid userId, string ipAddress, CancellationToken cancellationToken);
}
