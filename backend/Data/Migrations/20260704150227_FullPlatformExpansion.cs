using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SecureWatch.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class FullPlatformExpansion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "AiExplanation",
                table: "Threats",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AiImpact",
                table: "Threats",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AiPreventionSteps",
                table: "Threats",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FailedAttempts",
                table: "Threats",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RiskScore",
                table: "Threats",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "SecurityLogId",
                table: "Threats",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                table: "SecurityLogs",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "FailedLoginAttempts",
                table: "SecurityLogs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "FileSize",
                table: "SecurityLogs",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<int>(
                name: "SuccessfulLogins",
                table: "SecurityLogs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "EntityId",
                table: "AuditLogs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EntityType",
                table: "AuditLogs",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "AuditLogs",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "CveRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Query = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    CveId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Severity = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CvssScore = table.Column<decimal>(type: "numeric", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: false),
                    PublishedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ReferenceUrl = table.Column<string>(type: "character varying(600)", maxLength: 600, nullable: false),
                    SearchedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CveRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Incidents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ThreatId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Priority = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    AssignedTo = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ResolvedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Incidents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IpReputations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AbuseConfidenceScore = table.Column<int>(type: "integer", nullable: false),
                    CountryCode = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: false),
                    Isp = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    TotalReports = table.Column<int>(type: "integer", nullable: false),
                    IsMalicious = table.Column<bool>(type: "boolean", nullable: false),
                    CheckedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IpReputations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Reports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReportType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ExecutiveSummary = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    GeneratedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    GeneratedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IncidentNotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IncidentId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncidentNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IncidentNotes_Incidents_IncidentId",
                        column: x => x.IncidentId,
                        principalTable: "Incidents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CveRecords_CveId",
                table: "CveRecords",
                column: "CveId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentNotes_IncidentId",
                table: "IncidentNotes",
                column: "IncidentId");

            migrationBuilder.CreateIndex(
                name: "IX_IpReputations_IpAddress",
                table: "IpReputations",
                column: "IpAddress");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CveRecords");

            migrationBuilder.DropTable(
                name: "IncidentNotes");

            migrationBuilder.DropTable(
                name: "IpReputations");

            migrationBuilder.DropTable(
                name: "Reports");

            migrationBuilder.DropTable(
                name: "Incidents");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AiExplanation",
                table: "Threats");

            migrationBuilder.DropColumn(
                name: "AiImpact",
                table: "Threats");

            migrationBuilder.DropColumn(
                name: "AiPreventionSteps",
                table: "Threats");

            migrationBuilder.DropColumn(
                name: "FailedAttempts",
                table: "Threats");

            migrationBuilder.DropColumn(
                name: "RiskScore",
                table: "Threats");

            migrationBuilder.DropColumn(
                name: "SecurityLogId",
                table: "Threats");

            migrationBuilder.DropColumn(
                name: "ContentType",
                table: "SecurityLogs");

            migrationBuilder.DropColumn(
                name: "FailedLoginAttempts",
                table: "SecurityLogs");

            migrationBuilder.DropColumn(
                name: "FileSize",
                table: "SecurityLogs");

            migrationBuilder.DropColumn(
                name: "SuccessfulLogins",
                table: "SecurityLogs");

            migrationBuilder.DropColumn(
                name: "EntityId",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "EntityType",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "AuditLogs");
        }
    }
}
