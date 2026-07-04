using SecureWatch.Api.Models;

namespace SecureWatch.Api.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
}
