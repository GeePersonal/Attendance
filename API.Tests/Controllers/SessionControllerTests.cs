using API.Controllers;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Services;
using API.Tests.Helpers;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace API.Tests.Controllers;

/// <summary>
/// Unit tests for the SessionController which handles creating, retrieving,
/// updating, cloning, and deleting attendance sessions.
/// Uses an in-memory database and mocked UserManager.
/// </summary>
public class SessionControllerTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<UserManager<AppUser>> _userManager;
    private readonly TokenService _tokenService;
    private readonly IMapper _mapper;
    private readonly SessionController _controller;
    private readonly AppUser _testUser;

    public SessionControllerTests()
    {
        _context = TestHelpers.CreateInMemoryDbContext();
        _userManager = TestHelpers.CreateMockUserManager();
        var config = TestHelpers.CreateTestConfiguration();

        _userManager.Setup(x => x.GetRolesAsync(It.IsAny<AppUser>()))
            .ReturnsAsync(new List<string> { "Host" });

        _tokenService = new TokenService(_userManager.Object, config);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<API.RequestHelpers.MappingProfiles>();
        });
        _mapper = mapperConfig.CreateMapper();

        _testUser = TestHelpers.CreateTestUser();

        _userManager.Setup(x => x.FindByEmailAsync(_testUser.Email))
            .ReturnsAsync(_testUser);

        _controller = new SessionController(_context, _userManager.Object, _tokenService, _mapper);
        _controller.ControllerContext = TestHelpers.CreateControllerContext(_testUser.Email, _testUser.UserName);
    }

    // Tests that creating a session with valid data returns a SessionDto with the name and a link token.
    // Expected: SessionDto with SessionName "Test Session" and a non-empty LinkToken.
    [Fact]
    public async Task CreateSession_ValidData_ReturnsSessionDto()
    {
        var dto = new CreateSessionDto
        {
            SessionName = "Test Session",
            SessionExpiresAt = DateTime.UtcNow.AddMinutes(30),
            LinkExpiryFreequency = 30,
            RegenerateLinkToken = true
        };

        var result = await _controller.CreateSession(dto);

        result.Value.Should().NotBeNull();
        result.Value.SessionName.Should().Be("Test Session");
        result.Value.LinkToken.Should().NotBeNullOrEmpty();
    }

    // Tests that creating a session with a ClassId that doesn't exist returns 400 Bad Request.
    // Expected: BadRequestObjectResult with "Invalid class id" message.
    [Fact]
    public async Task CreateSession_WithInvalidClassId_ReturnsBadRequest()
    {
        var dto = new CreateSessionDto
        {
            SessionName = "Test Session",
            SessionExpiresAt = DateTime.UtcNow.AddMinutes(30),
            LinkExpiryFreequency = 30,
            RegenerateLinkToken = true,
            ClassId = Guid.NewGuid()
        };

        var result = await _controller.CreateSession(dto);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // Tests that creating a session linked to an existing class returns the session with that ClassId.
    // Expected: SessionDto with ClassId matching the created class.
    [Fact]
    public async Task CreateSession_WithValidClassId_ReturnsSessionWithClass()
    {
        var testClass = TestHelpers.CreateTestClass(_testUser);
        _context.Classes.Add(testClass);
        await _context.SaveChangesAsync();

        var dto = new CreateSessionDto
        {
            SessionName = "Class Session",
            SessionExpiresAt = DateTime.UtcNow.AddMinutes(30),
            LinkExpiryFreequency = 30,
            RegenerateLinkToken = true,
            ClassId = testClass.Id
        };

        var result = await _controller.CreateSession(dto);

        result.Value.Should().NotBeNull();
        result.Value.ClassId.Should().Be(testClass.Id.ToString());
    }

    // Tests that the minimum link expiry frequency is enforced at 30 seconds.
    // When a value below 30 is provided, it should be clamped to 30.
    // Expected: LinkExpiryFreequency is 30 even though 5 was requested.
    [Fact]
    public async Task CreateSession_LinkExpiryBelow30_SetsTo30()
    {
        var dto = new CreateSessionDto
        {
            SessionName = "Test Session",
            SessionExpiresAt = DateTime.UtcNow.AddMinutes(30),
            LinkExpiryFreequency = 5, // Below minimum
            RegenerateLinkToken = true
        };

        var result = await _controller.CreateSession(dto);

        result.Value.Should().NotBeNull();
        result.Value.LinkExpiryFreequency.Should().Be(30);
    }

    // Tests that deleting a session with an ID that doesn't exist returns 400 Bad Request.
    // Expected: BadRequestObjectResult with "Invalid session id".
    [Fact]
    public async Task DeleteSession_InvalidId_ReturnsBadRequest()
    {
        var result = await _controller.DeleteSession(Guid.NewGuid().ToString());

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // Tests that the owner can successfully delete their own session.
    // Expected: OkResult returned and session removed from the database.
    [Fact]
    public async Task DeleteSession_ValidId_ReturnsOk()
    {
        var session = TestHelpers.CreateTestSession(_testUser);
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        var result = await _controller.DeleteSession(session.Id.ToString());

        result.Should().BeOfType<OkResult>();
        _context.Sessions.Should().BeEmpty();
    }

    // Tests that a user cannot delete a session they do not own.
    // Expected: UnauthorizedObjectResult — only the session host can delete it.
    [Fact]
    public async Task DeleteSession_NotOwner_ReturnsUnauthorized()
    {
        var otherUser = TestHelpers.CreateTestUser(email: "other@test.com");
        var session = TestHelpers.CreateTestSession(otherUser);
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        var result = await _controller.DeleteSession(session.Id.ToString());

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    // Tests that fetching a session with a non-existent ID returns 400 Bad Request.
    // Expected: BadRequestObjectResult with "Invalid session id".
    [Fact]
    public async Task GetSession_InvalidId_ReturnsBadRequest()
    {
        var result = await _controller.GetSession(Guid.NewGuid().ToString());

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // Tests that fetching a session owned by the current user returns its details.
    // Expected: SessionDto with SessionName "Test Session".
    [Fact]
    public async Task GetSession_ValidId_ReturnsSessionDto()
    {
        var session = TestHelpers.CreateTestSession(_testUser);
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        var result = await _controller.GetSession(session.Id.ToString());

        result.Value.Should().NotBeNull();
        result.Value.SessionName.Should().Be("Test Session");
    }

    // Tests that requesting the current session when no sessions exist returns 400 Bad Request.
    // Expected: BadRequestObjectResult with "You do not have any active session".
    [Fact]
    public async Task GetCurrentSession_NoActiveSession_ReturnsBadRequest()
    {
        var result = await _controller.GetCurrentSession();

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // Tests that requesting the current session when the most recent session is expired returns 400 Bad Request.
    // Expected: BadRequestObjectResult — expired sessions are not considered active.
    [Fact]
    public async Task GetCurrentSession_ExpiredSession_ReturnsBadRequest()
    {
        var session = TestHelpers.CreateTestSession(_testUser, minutesUntilExpiry: -10); // Already expired
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        var result = await _controller.GetCurrentSession();

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // Tests that requesting the current session when an active (non-expired) session exists returns it.
    // Expected: SessionDto with SessionName "Test Session".
    [Fact]
    public async Task GetCurrentSession_ActiveSession_ReturnsSessionDto()
    {
        var session = TestHelpers.CreateTestSession(_testUser, minutesUntilExpiry: 30);
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        var result = await _controller.GetCurrentSession();

        result.Value.Should().NotBeNull();
        result.Value.SessionName.Should().Be("Test Session");
    }

    // Tests that cloning a session with a non-existent ID returns 400 Bad Request.
    // Expected: BadRequestObjectResult with "Invalid session id".
    [Fact]
    public async Task CloneSession_InvalidId_ReturnsBadRequest()
    {
        var result = await _controller.CloneSession(Guid.NewGuid().ToString());

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // Tests that cloning a valid session creates a duplicate with " (Copy)" appended to the name.
    // Expected: SessionDto with name "Original (Copy)" and 2 total sessions in the database.
    [Fact]
    public async Task CloneSession_ValidId_ReturnsClonedSession()
    {
        var session = TestHelpers.CreateTestSession(_testUser, name: "Original");
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        var result = await _controller.CloneSession(session.Id.ToString());

        result.Value.Should().NotBeNull();
        result.Value.SessionName.Should().Be("Original (Copy)");
        _context.Sessions.Should().HaveCount(2);
    }

    // Tests that updating a session with a non-existent ID returns 401 Unauthorized.
    // Expected: UnauthorizedResult — session not found for the current user.
    [Fact]
    public async Task UpdateSession_InvalidId_ReturnsUnauthorized()
    {
        var dto = new CreateSessionDto
        {
            SessionName = "Updated",
            SessionExpiresAt = DateTime.UtcNow.AddMinutes(60),
            LinkExpiryFreequency = 30,
            RegenerateLinkToken = true
        };

        var result = await _controller.UpdateSession(Guid.NewGuid().ToString(), dto);

        result.Result.Should().BeOfType<UnauthorizedResult>();
    }

    // Tests that updating a session's name, expiry, link frequency, and regenerate flag persists correctly.
    // Expected: SessionDto with updated values — name "Updated Session", frequency 45, regenerate false.
    [Fact]
    public async Task UpdateSession_ValidId_ReturnsUpdatedSession()
    {
        var session = TestHelpers.CreateTestSession(_testUser);
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        var dto = new CreateSessionDto
        {
            SessionName = "Updated Session",
            SessionExpiresAt = DateTime.UtcNow.AddMinutes(60),
            LinkExpiryFreequency = 45,
            RegenerateLinkToken = false
        };

        var result = await _controller.UpdateSession(session.Id.ToString(), dto);

        result.Value.Should().NotBeNull();
        result.Value.SessionName.Should().Be("Updated Session");
        result.Value.LinkExpiryFreequency.Should().Be(45);
        result.Value.RegenerateLinkToken.Should().BeFalse();
    }
}
