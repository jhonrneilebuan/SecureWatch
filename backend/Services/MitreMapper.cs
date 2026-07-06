namespace SecureWatch.Api.Services;

public static class MitreMapper
{
    public static (string Id, string Name) Map(string? threatType)
    {
        var normalized = (threatType ?? string.Empty).ToLowerInvariant();
        if (normalized.Contains("brute") || normalized.Contains("failed login"))
        {
            return ("T1110", "Brute Force");
        }

        if (normalized.Contains("sql injection"))
        {
            return ("T1190", "Exploit Public-Facing Application");
        }

        if (normalized.Contains("privilege"))
        {
            return ("T1068", "Exploitation for Privilege Escalation");
        }

        if (normalized.Contains("impossible travel"))
        {
            return ("T1078", "Valid Accounts");
        }

        if (normalized.Contains("admin"))
        {
            return ("T1078", "Valid Accounts");
        }

        return ("T1087", "Account Discovery");
    }
}
