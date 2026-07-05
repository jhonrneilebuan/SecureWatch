namespace SecureWatch.Api.Services;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string passwordHash);
}

public interface IPasswordPolicy
{
    void Validate(string password);
}
