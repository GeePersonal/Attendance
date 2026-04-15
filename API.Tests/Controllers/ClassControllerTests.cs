using API.Controllers;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Tests.Helpers;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace API.Tests.Controllers;

/// <summary>
/// Unit tests for the ClassController which handles CRUD operations for classes
/// and linking/unlinking sessions to classes.
/// Uses an in-memory database and mocked UserManager.
/// </summary>
public class ClassControllerTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<UserManager<AppUser>> _userManager;
    private readonly IMapper _mapper;
    private readonly ClassController _controller;
    private readonly AppUser _testUser;

    public ClassControllerTests()
    {
        _context = TestHelpers.CreateInMemoryDbContext();
        _userManager = TestHelpers.CreateMockUserManager();

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<API.RequestHelpers.MappingProfiles>();
        });
        _mapper = mapperConfig.CreateMapper();

        _testUser = TestHelpers.CreateTestUser();

        _userManager.Setup(x => x.FindByEmailAsync(_testUser.Email))
            .ReturnsAsync(_testUser);

        _controller = new ClassController(_context, _userManager.Object, _mapper);
        _controller.ControllerContext = TestHelpers.CreateControllerContext(_testUser.Email, _testUser.UserName);
    }

    // Tests that creating a class with valid name and description returns a ClassDto with correct values.
    // Expected: ClassDto with Name "Test Class", Description "A test class", HostName "Test User".
    [Fact]
    public async Task CreateClass_ValidData_ReturnsClassDto()
    {
        var dto = new CreateClassDto { Name = "Test Class", Description = "A test class" };

        var result = await _controller.CreateClass(dto);

        result.Value.Should().NotBeNull();
        result.Value.Name.Should().Be("Test Class");
        result.Value.Description.Should().Be("A test class");
        result.Value.HostName.Should().Be("Test User");
    }

    // Tests that fetching a class with a non-existent ID returns 400 Bad Request.
    // Expected: BadRequestObjectResult with "Invalid class id".
    [Fact]
    public async Task GetClass_InvalidId_ReturnsBadRequest()
    {
        var result = await _controller.GetClass(Guid.NewGuid().ToString());

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // Tests that fetching a class by a valid ID returns its details.
    // Expected: ClassDto with Name "My Class".
    [Fact]
    public async Task GetClass_ValidId_ReturnsClassDto()
    {
        var testClass = TestHelpers.CreateTestClass(_testUser, "My Class");
        _context.Classes.Add(testClass);
        await _context.SaveChangesAsync();

        var result = await _controller.GetClass(testClass.Id.ToString());

        result.Value.Should().NotBeNull();
        result.Value.Name.Should().Be("My Class");
    }

    // Tests that updating a class with a non-existent ID returns 401 Unauthorized.
    // Expected: UnauthorizedResult — class not found for the current user.
    [Fact]
    public async Task UpdateClass_InvalidId_ReturnsUnauthorized()
    {
        var dto = new CreateClassDto { Name = "Updated", Description = "Updated desc" };

        var result = await _controller.UpdateClass(Guid.NewGuid().ToString(), dto);

        result.Result.Should().BeOfType<UnauthorizedResult>();
    }

    // Tests that updating a class's name and description persists the changes correctly.
    // Expected: ClassDto with Name "Updated Name" and Description "Updated Description".
    [Fact]
    public async Task UpdateClass_ValidId_ReturnsUpdatedClass()
    {
        var testClass = TestHelpers.CreateTestClass(_testUser);
        _context.Classes.Add(testClass);
        await _context.SaveChangesAsync();

        var dto = new CreateClassDto { Name = "Updated Name", Description = "Updated Description" };

        var result = await _controller.UpdateClass(testClass.Id.ToString(), dto);

        result.Value.Should().NotBeNull();
        result.Value.Name.Should().Be("Updated Name");
        result.Value.Description.Should().Be("Updated Description");
    }

    // Tests that deleting a class with a non-existent ID returns 400 Bad Request.
    // Expected: BadRequestObjectResult with "Invalid class id".
    [Fact]
    public async Task DeleteClass_InvalidId_ReturnsBadRequest()
    {
        var result = await _controller.DeleteClass(Guid.NewGuid().ToString());

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // Tests that a user cannot delete a class they do not own.
    // Expected: UnauthorizedObjectResult — only the class host can delete it.
    [Fact]
    public async Task DeleteClass_NotOwner_ReturnsUnauthorized()
    {
        var otherUser = TestHelpers.CreateTestUser(email: "other@test.com");
        var testClass = TestHelpers.CreateTestClass(otherUser);
        _context.Classes.Add(testClass);
        await _context.SaveChangesAsync();

        var result = await _controller.DeleteClass(testClass.Id.ToString());

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    // Tests that the owner can successfully delete their own class.
    // Expected: OkResult returned and class removed from the database.
    [Fact]
    public async Task DeleteClass_ValidId_ReturnsOk()
    {
        var testClass = TestHelpers.CreateTestClass(_testUser);
        _context.Classes.Add(testClass);
        await _context.SaveChangesAsync();

        var result = await _controller.DeleteClass(testClass.Id.ToString());

        result.Should().BeOfType<OkResult>();
        _context.Classes.Should().BeEmpty();
    }

    // Tests that linking a session to a non-existent class returns 400 Bad Request.
    // Expected: BadRequestObjectResult with "Invalid class id".
    [Fact]
    public async Task AddSessionToClass_InvalidClassId_ReturnsBadRequest()
    {
        var session = TestHelpers.CreateTestSession(_testUser);
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        var result = await _controller.AddSessionToClass(Guid.NewGuid().ToString(), session.Id.ToString());

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // Tests that linking a non-existent session to a valid class returns 400 Bad Request.
    // Expected: BadRequestObjectResult with "Invalid session id".
    [Fact]
    public async Task AddSessionToClass_InvalidSessionId_ReturnsBadRequest()
    {
        var testClass = TestHelpers.CreateTestClass(_testUser);
        _context.Classes.Add(testClass);
        await _context.SaveChangesAsync();

        var result = await _controller.AddSessionToClass(testClass.Id.ToString(), Guid.NewGuid().ToString());

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // Tests that linking a valid session to a valid class sets the session's ClassId.
    // Expected: OkResult and the session's ClassId now matches the class ID in the database.
    [Fact]
    public async Task AddSessionToClass_ValidIds_ReturnsOkAndLinksSession()
    {
        var testClass = TestHelpers.CreateTestClass(_testUser);
        var session = TestHelpers.CreateTestSession(_testUser);
        _context.Classes.Add(testClass);
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        var result = await _controller.AddSessionToClass(testClass.Id.ToString(), session.Id.ToString());

        result.Should().BeOfType<OkResult>();
        var updatedSession = await _context.Sessions.FindAsync(session.Id);
        updatedSession.ClassId.Should().Be(testClass.Id);
    }

    // Tests that removing a session from a class with invalid IDs returns 400 Bad Request.
    // Expected: BadRequestObjectResult with "Invalid session or class id".
    [Fact]
    public async Task RemoveSessionFromClass_InvalidIds_ReturnsBadRequest()
    {
        var result = await _controller.RemoveSessionFromClass(Guid.NewGuid().ToString(), Guid.NewGuid().ToString());

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // Tests that removing a session from a class sets the session's ClassId to null.
    // Expected: OkResult and the session's ClassId is null in the database.
    [Fact]
    public async Task RemoveSessionFromClass_ValidIds_ReturnsOkAndUnlinksSession()
    {
        var testClass = TestHelpers.CreateTestClass(_testUser);
        var session = TestHelpers.CreateTestSession(_testUser, @class: testClass);
        _context.Classes.Add(testClass);
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        var result = await _controller.RemoveSessionFromClass(testClass.Id.ToString(), session.Id.ToString());

        result.Should().BeOfType<OkResult>();
        var updatedSession = await _context.Sessions.FindAsync(session.Id);
        updatedSession.ClassId.Should().BeNull();
    }
}
