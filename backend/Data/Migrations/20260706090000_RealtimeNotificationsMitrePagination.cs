using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SecureWatch.Api.Data;

#nullable disable

namespace SecureWatch.Api.Data.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260706090000_RealtimeNotificationsMitrePagination")]
    public partial class RealtimeNotificationsMitrePagination : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MitreTechniqueId",
                table: "Threats",
                type: "character varying(24)",
                maxLength: 24,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MitreTechniqueName",
                table: "Threats",
                type: "character varying(160)",
                maxLength: 160,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SourceSystem",
                table: "SecurityLogs",
                type: "character varying(160)",
                maxLength: 160,
                nullable: false,
                defaultValue: "Manual Upload");

            migrationBuilder.AddColumn<string>(
                name: "SourceType",
                table: "SecurityLogs",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "File");

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Severity = table.Column<string>(type: "text", nullable: false),
                    EntityType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    EntityId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_IsRead_CreatedAt",
                table: "Notifications",
                columns: new[] { "IsRead", "CreatedAt" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Notifications");

            migrationBuilder.DropColumn(name: "MitreTechniqueId", table: "Threats");
            migrationBuilder.DropColumn(name: "MitreTechniqueName", table: "Threats");
            migrationBuilder.DropColumn(name: "SourceSystem", table: "SecurityLogs");
            migrationBuilder.DropColumn(name: "SourceType", table: "SecurityLogs");
        }
    }
}
