using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using SecureWatch.Api.DTOs;
using SecureWatch.Api.Services;

namespace SecureWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken) =>
        Ok(await authService.RegisterAsync(request, cancellationToken));

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken) =>
        Ok(await authService.LoginAsync(request, cancellationToken));

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await authService.RecordLogoutAsync(userId, HttpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty, cancellationToken);
        return NoContent();
    }
}
