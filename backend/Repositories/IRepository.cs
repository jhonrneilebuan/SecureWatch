namespace SecureWatch.Api.Repositories;

public interface IRepository<T> where T : class
{
    Task<IReadOnlyCollection<T>> ListAsync(CancellationToken cancellationToken = default);
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    void Remove(T entity);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
