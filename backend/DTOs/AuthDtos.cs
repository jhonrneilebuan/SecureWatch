using SecureWatch.Api.Models;

namespace SecureWatch.Api.DTOs;

public sealed record RegisterRequest(string FullName, string Email, string Password, UserRole Role);
public sealed record LoginRequest(string Email, string Password);
public sealed record AuthResponse(string Token, string Email, string FullName, UserRole Role);
