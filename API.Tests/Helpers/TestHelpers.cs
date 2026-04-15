using System.Security.Claims;
using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;

namespace API.Tests.Helpers;

public static class TestHelpers
{
    public static ApplicationDbContext CreateInMemoryDbContext(string dbName = null)
    {
        dbName ??= Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new ApplicationDbContext(options);
    }

    public static IConfiguration CreateTestConfiguration()
    {
        var inMemorySettings = new Dictionary<string, string>
        {
            { "JWTSettings:TokenKey", "super-secret-test-key-that-is-long-enough-for-hmac-sha512-algorithm-requirements" },
            { "Google:ClientId", "test-google-client-id" }
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();
    }

    public static AppUser CreateTestUser(string id = null, string email = "test@test.com",
        string firstName = "Test", string lastName = "User")
    {
        return new AppUser
        {
            Id = id ?? Guid.NewGuid().ToString(),
            Email = email,
            UserName = email,
            FirstName = firstName,
            LastName = lastName,
            NormalizedEmail = email.ToUpper(),
            NormalizedUserName = email.ToUpper()
        };
    }

    public static Session CreateTestSession(AppUser host, string name = "Test Session",
        int minutesUntilExpiry = 30, Class @class = null)
    {
        return new Session
        {
            Id = Guid.NewGuid(),
            SessionName = name,
            Host = host,
            HostId = host.Id,
            SessionExpiresAt = DateTime.UtcNow.AddMinutes(minutesUntilExpiry),
            CreatedAt = DateTime.UtcNow,
            RegenerateLinkToken = true,
            LinkExpiryFreequency = 30,
            Class = @class,
            ClassId = @class?.Id
        };
    }

    public static Class CreateTestClass(AppUser host, string name = "Test Class")
    {
        return new Class
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = "Test Description",
            Host = host,
            HostId = host.Id,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static Attendee CreateTestAttendee(Guid sessionId, string email = "student@test.com",
        string firstName = "Student", string lastName = "One")
    {
        return new Attendee
        {
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            MATNumber = "12345",
            SessionId = sessionId,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static Mock<UserManager<AppUser>> CreateMockUserManager()
    {
        var store = new Mock<IUserStore<AppUser>>();
        var mgr = new Mock<UserManager<AppUser>>(store.Object, null, null, null, null, null, null, null, null);
        mgr.Object.UserValidators.Add(new UserValidator<AppUser>());
        mgr.Object.PasswordValidators.Add(new PasswordValidator<AppUser>());
        return mgr;
    }

    public static Mock<SignInManager<AppUser>> CreateMockSignInManager(Mock<UserManager<AppUser>> userManager)
    {
        var contextAccessor = new Mock<IHttpContextAccessor>();
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<AppUser>>();
        return new Mock<SignInManager<AppUser>>(
            userManager.Object, contextAccessor.Object, claimsFactory.Object, null, null, null, null);
    }

    public static ClaimsPrincipal CreateClaimsPrincipal(string email, string username)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Name, username)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        return new ClaimsPrincipal(identity);
    }

    public static ControllerContext CreateControllerContext(string email, string username)
    {
        var httpContext = new DefaultHttpContext
        {
            User = CreateClaimsPrincipal(email, username)
        };
        return new ControllerContext
        {
            HttpContext = httpContext
        };
    }
}
