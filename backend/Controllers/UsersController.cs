using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Data;
using SecureWatch.Api.DTOs;
using SecureWatch.Api.Models;
using SecureWatch.Api.Services;

namespace SecureWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public sealed class UsersController(AppDbContext dbContext, IPasswordHasher passwordHasher) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Ok(await dbContext.Users.AsNoTracking().Select(x => new UserDto(x.Id, x.FullName, x.Email, x.Role, x.IsActive, x.CreatedAt)).ToListAsync(cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(CreateUserRequest request, CancellationToken cancellationToken)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHasher.Hash(request.Password),
            Role = request.Role,
            IsActive = true
        };

        await dbContext.Users.AddAsync(user, cancellationToken);
        await dbContext.AuditLogs.AddAsync(new AuditLog { Id = Guid.NewGuid(), UserId = user.Id, Action = "User created", EntityType = nameof(User), EntityId = user.Id }, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetAll), new UserDto(user.Id, user.FullName, user.Email, user.Role, user.IsActive, user.CreatedAt));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FindAsync([id], cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        user.FullName = request.FullName;
        user.Role = request.Role;
        user.IsActive = request.IsActive;
        await dbContext.AuditLogs.AddAsync(new AuditLog { Id = Guid.NewGuid(), UserId = user.Id, Action = "User updated or role changed", EntityType = nameof(User), EntityId = user.Id }, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new UserDto(user.Id, user.FullName, user.Email, user.Role, user.IsActive, user.CreatedAt));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FindAsync([id], cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        dbContext.Users.Remove(user);
        await dbContext.AuditLogs.AddAsync(new AuditLog { Id = Guid.NewGuid(), UserId = id, Action = "User deleted", EntityType = nameof(User), EntityId = id }, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
