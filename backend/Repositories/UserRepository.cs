using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Data;
using SecureWatch.Api.Models;

namespace SecureWatch.Api.Repositories;

public sealed class UserRepository : Repository<User>, IUserRepository
{
    private readonly AppDbContext _dbContext;

    public UserRepository(AppDbContext dbContext) : base(dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        _dbContext.Users.FirstOrDefaultAsync(x => x.Email == email.ToLowerInvariant(), cancellationToken);
}
