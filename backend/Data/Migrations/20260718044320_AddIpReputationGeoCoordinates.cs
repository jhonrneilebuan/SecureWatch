using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SecureWatch.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIpReputationGeoCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "IpReputations",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "IpReputations",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "IpReputations");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "IpReputations");
        }
    }
}
