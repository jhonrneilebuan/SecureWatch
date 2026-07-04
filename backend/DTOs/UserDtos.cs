using SecureWatch.Api.Models;

namespace SecureWatch.Api.DTOs;

public sealed record UserDto(Guid Id, string FullName, string Email, UserRole Role, bool IsActive, DateTimeOffset CreatedAt);
public sealed record CreateUserRequest(string FullName, string Email, string Password, UserRole Role);
public sealed record UpdateUserRequest(string FullName, UserRole Role, bool IsActive);
