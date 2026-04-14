using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace API.Data;
public class ApplicationDbContext : IdentityDbContext<AppUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured
            && !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL")))
        {
            // Use connection string provided at runtime by FlyIO.
            var connUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

            // Parse connection URL to connection string for Npgsql
            connUrl = connUrl.Replace("postgres://", string.Empty);
            string pgUserPass = connUrl.Split("@")[0];
            string pgHostPortDb = connUrl.Split("@")[1];
            string pgHostPort = pgHostPortDb.Split("/")[0];
            string pgDb = pgHostPortDb.Split("/")[1];
            string pgUser = pgUserPass.Split(":")[0];
            string pgPass = pgUserPass.Split(":")[1];
            string pgHost = pgHostPort.Split(":")[0];
            string pgPort = pgHostPort.Split(":")[1];
            string updatedHost = pgHost.Replace("flycast", "internal");

            var connString = $"Server={updatedHost};Port={pgPort};User Id={pgUser};Password={pgPass};Database={pgDb}";
            optionsBuilder.UseNpgsql(connString);
        }
    }

    public DbSet<Attendee> Attendees { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<Class> Classes { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<IdentityRole>(x => x.HasData(
            new IdentityRole { Id = "1", Name = "Admin", NormalizedName = "ADMIN" },
            new IdentityRole { Id = "2", Name = "Host", NormalizedName = "HOST" },
            new IdentityRole { Id = "3", Name = "Attendee", NormalizedName = "Attendee" }
        ));

        builder.Entity<Class>()
            .HasMany(c => c.Sessions)
            .WithOne(s => s.Class)
            .HasForeignKey(s => s.ClassId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
