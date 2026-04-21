using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceLatLongWithLocationName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScanLatitude",
                table: "Attendees");

            migrationBuilder.DropColumn(
                name: "ScanLongitude",
                table: "Attendees");

            migrationBuilder.AddColumn<string>(
                name: "ScanLocationName",
                table: "Attendees",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScanLocationName",
                table: "Attendees");

            migrationBuilder.AddColumn<double>(
                name: "ScanLatitude",
                table: "Attendees",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "ScanLongitude",
                table: "Attendees",
                type: "double precision",
                nullable: true);
        }
    }
}
