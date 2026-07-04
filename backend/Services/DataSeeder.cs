using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Data;
using SecureWatch.Api.Models;

namespace SecureWatch.Api.Services;

public sealed class DataSeeder(AppDbContext dbContext, IPasswordHasher passwordHasher)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var migrations = dbContext.Database.GetMigrations();
        if (migrations.Any())
        {
            await dbContext.Database.MigrateAsync(cancellationToken);
        }
        else
        {
            await dbContext.Database.EnsureCreatedAsync(cancellationToken);
        }

        if (await dbContext.Users.AnyAsync(cancellationToken))
        {
            return;
        }

        var defaultPassword = passwordHasher.Hash("SecureWatch@123");
        var users = new[]
        {
            new User
            {
                Id = Guid.NewGuid(),
                FullName = "SecureWatch Admin",
                Email = "admin@securewatch.com",
                PasswordHash = defaultPassword,
                Role = UserRole.Admin
            },
            new User
            {
                Id = Guid.NewGuid(),
                FullName = "Security Analyst",
                Email = "analyst@securewatch.com",
                PasswordHash = defaultPassword,
                Role = UserRole.Analyst
            }
        };

        await dbContext.Users.AddRangeAsync(users, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
