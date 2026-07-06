using Microsoft.EntityFrameworkCore;
using SecureWatch.Api.Models;

namespace SecureWatch.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<SecurityLog> SecurityLogs => Set<SecurityLog>();
    public DbSet<Threat> Threats => Set<Threat>();
    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<IncidentNote> IncidentNotes => Set<IncidentNote>();
    public DbSet<IncidentEvidence> IncidentEvidence => Set<IncidentEvidence>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<IpReputation> IpReputations => Set<IpReputation>();
    public DbSet<CveRecord> CveRecords => Set<CveRecord>();
    public DbSet<LoginAttempt> LoginAttempts => Set<LoginAttempt>();
    public DbSet<EmailAlert> EmailAlerts => Set<EmailAlert>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(256);
            entity.Property(x => x.FullName).HasMaxLength(160);
            entity.Property(x => x.Role).HasConversion<string>();
            entity.Property(x => x.IsActive).HasDefaultValue(true);
            entity.Property(x => x.RefreshTokenHash).HasMaxLength(128);
        });

        modelBuilder.Entity<LoginAttempt>(entity =>
        {
            entity.HasIndex(x => new { x.Email, x.IpAddress, x.AttemptedAt });
            entity.Property(x => x.Email).HasMaxLength(256);
            entity.Property(x => x.IpAddress).HasMaxLength(64);
        });

        modelBuilder.Entity<EmailAlert>(entity =>
        {
            entity.Property(x => x.Recipients).HasMaxLength(600);
            entity.Property(x => x.Subject).HasMaxLength(240);
            entity.Property(x => x.Status).HasConversion<string>();
        });

        modelBuilder.Entity<SecurityLog>(entity =>
        {
            entity.Property(x => x.FileName).HasMaxLength(260);
            entity.Property(x => x.ContentType).HasMaxLength(120);
            entity.Property(x => x.SourceSystem).HasMaxLength(160);
            entity.Property(x => x.SourceType).HasMaxLength(80);
            entity.Property(x => x.Status).HasConversion<string>();
        });

        modelBuilder.Entity<Threat>(entity =>
        {
            entity.Property(x => x.ThreatType).HasMaxLength(120);
            entity.Property(x => x.Severity).HasConversion<string>();
            entity.Property(x => x.SourceIP).HasMaxLength(64);
            entity.Property(x => x.MitreTechniqueId).HasMaxLength(24);
            entity.Property(x => x.MitreTechniqueName).HasMaxLength(160);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(x => x.Title).HasMaxLength(180);
            entity.Property(x => x.EntityType).HasMaxLength(80);
            entity.Property(x => x.Severity).HasConversion<string>();
            entity.HasIndex(x => new { x.IsRead, x.CreatedAt });
        });

        modelBuilder.Entity<Incident>(entity =>
        {
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.Priority).HasConversion<string>();
            entity.Property(x => x.Status).HasConversion<string>();
            entity.Property(x => x.ResolutionNotes).HasMaxLength(2_000);
            entity.HasMany(x => x.Notes).WithOne().HasForeignKey(x => x.IncidentId);
            entity.HasMany(x => x.Evidence).WithOne().HasForeignKey(x => x.IncidentId);
        });

        modelBuilder.Entity<IncidentNote>()
            .Property(x => x.Note)
            .HasMaxLength(2_000);

        modelBuilder.Entity<IncidentEvidence>(entity =>
        {
            entity.Property(x => x.Title).HasMaxLength(160);
            entity.Property(x => x.EvidenceType).HasMaxLength(80);
            entity.Property(x => x.Reference).HasMaxLength(1_000);
        });

        modelBuilder.Entity<Report>(entity =>
        {
            entity.Property(x => x.ReportType).HasMaxLength(80);
            entity.Property(x => x.ExecutiveSummary).HasMaxLength(4_000);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(x => x.Action).HasMaxLength(240);
            entity.Property(x => x.EntityType).HasMaxLength(80);
            entity.Property(x => x.IpAddress).HasMaxLength(64);
        });

        modelBuilder.Entity<IpReputation>(entity =>
        {
            entity.HasIndex(x => x.IpAddress);
            entity.Property(x => x.IpAddress).HasMaxLength(64);
            entity.Property(x => x.CountryCode).HasMaxLength(12);
            entity.Property(x => x.Isp).HasMaxLength(240);
        });

        modelBuilder.Entity<CveRecord>(entity =>
        {
            entity.HasIndex(x => x.CveId);
            entity.Property(x => x.Query).HasMaxLength(160);
            entity.Property(x => x.CveId).HasMaxLength(40);
            entity.Property(x => x.Severity).HasMaxLength(40);
            entity.Property(x => x.ReferenceUrl).HasMaxLength(600);
        });
    }
}
