using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Data;

namespace SecureWatch.Api.Repositories;

public class Repository<T>(AppDbContext dbContext) : IRepository<T> where T : class
{
    public async Task<IReadOnlyCollection<T>> ListAsync(CancellationToken cancellationToken = default) =>
        await dbContext.Set<T>().AsNoTracking().ToListAsync(cancellationToken);

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await dbContext.Set<T>().FindAsync([id], cancellationToken);

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default) =>
        await dbContext.Set<T>().AddAsync(entity, cancellationToken);

    public void Remove(T entity) => dbContext.Set<T>().Remove(entity);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        dbContext.SaveChangesAsync(cancellationToken);
}
