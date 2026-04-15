using API.Controllers;
using API.DTOs;
using API.Entities;
using API.Services;
using API.Tests.Helpers;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;

namespace API.Tests.Controllers;

/// <summary>
/// Unit tests for the AccountController which handles user authentication,
/// registration, Google OAuth login, and JWT token management.
/// </summary>
public class AccountControllerTests
{
    private readonly Mock<UserManager<AppUser>> _userManager;
    private readonly Mock<SignInManager<AppUser>> _signInManager;
    private readonly TokenService _tokenService;
    private readonly IMapper _mapper;
    private readonly IConfiguration _config;
    private readonly AccountController _controller;

    public AccountControllerTests()
    {
        _userManager = TestHelpers.CreateMockUserManager();
        _signInManager = TestHelpers.CreateMockSignInManager(_userManager);
        _config = TestHelpers.CreateTestConfiguration();

        _userManager.Setup(x => x.GetRolesAsync(It.IsAny<AppUser>()))
            .ReturnsAsync(new List<string> { "Host" });

        _tokenService = new TokenService(_userManager.Object, _config);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<API.RequestHelpers.MappingProfiles>();
        });
        _mapper = mapperConfig.CreateMapper();

        _controller = new AccountController(_userManager.Object, _signInManager.Object, _tokenService, _mapper, _config);
    }

    // Tests that logging in with an email that doesn't exist in the system returns 401 Unauthorized.
    // Expected: UnauthorizedObjectResult with error message.
    [Fact]
    public async Task Login_InvalidEmail_ReturnsUnauthorized()
    {
        _userManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((AppUser)null);

        var loginDto = new LoginDto { Email = "wrong@test.com", Password = "password" };

        var result = await _controller.Login(loginDto);

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    // Tests that logging in with a valid email but wrong password returns 401 Unauthorized.
    // Expected: UnauthorizedObjectResult when password check fails.
    [Fact]
    public async Task Login_InvalidPassword_ReturnsUnauthorized()
    {
        var user = TestHelpers.CreateTestUser();
        _userManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync(user);
        _signInManager.Setup(x => x.CheckPasswordSignInAsync(user, It.IsAny<string>(), false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

        var loginDto = new LoginDto { Email = user.Email, Password = "wrong" };

        var result = await _controller.Login(loginDto);

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    // Tests that logging in with valid email and password returns a UserDto with display name and JWT token.
    // Expected: UserDto with DisplayName "Test User" and a non-empty Token string.
    [Fact]
    public async Task Login_ValidCredentials_ReturnsUserDto()
    {
        var user = TestHelpers.CreateTestUser();
        user.RefreshAppUserTokens = new List<RefereshAppUserToken>();

        _userManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync(user);
        _signInManager.Setup(x => x.CheckPasswordSignInAsync(user, It.IsAny<string>(), false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
        _userManager.Setup(x => x.UpdateAsync(It.IsAny<AppUser>()))
            .ReturnsAsync(IdentityResult.Success);

        var loginDto = new LoginDto { Email = user.Email, Password = "password" };

        _controller.ControllerContext = TestHelpers.CreateControllerContext(user.Email, user.UserName);

        var result = await _controller.Login(loginDto);

        result.Value.Should().NotBeNull();
        result.Value.DisplayName.Should().Be("Test User");
        result.Value.Token.Should().NotBeNullOrEmpty();
    }

    // Tests that registering with an email that already exists returns 400 Bad Request.
    // Expected: BadRequestObjectResult with "User name or Email taken" message.
    [Fact]
    public async Task Register_DuplicateEmail_ReturnsBadRequest()
    {
        _userManager.Setup(x => x.Users)
            .Returns(new List<AppUser> { TestHelpers.CreateTestUser() }.AsQueryable().BuildMockDbSet().Object);

        var registerDto = new RegisterDto
        {
            Email = "test@test.com",
            Password = "password",
            FirstName = "Test",
            LastName = "User"
        };

        var result = await _controller.Register(registerDto);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // Tests that registering with a new, unique email and valid data returns 201 Created.
    // Expected: CreatedResult containing the new UserDto.
    [Fact]
    public async Task Register_ValidData_ReturnsCreated()
    {
        _userManager.Setup(x => x.Users)
            .Returns(new List<AppUser>().AsQueryable().BuildMockDbSet().Object);
        _userManager.Setup(x => x.CreateAsync(It.IsAny<AppUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        var registerDto = new RegisterDto
        {
            Email = "new@test.com",
            Password = "password",
            FirstName = "New",
            LastName = "User"
        };

        var result = await _controller.Register(registerDto);

        result.Should().BeOfType<CreatedResult>();
    }

    // Tests that when Identity's CreateAsync fails (e.g. validation error), registration returns 400 Bad Request.
    // Expected: BadRequestObjectResult with "Problem registering user" message.
    [Fact]
    public async Task Register_FailedCreation_ReturnsBadRequest()
    {
        _userManager.Setup(x => x.Users)
            .Returns(new List<AppUser>().AsQueryable().BuildMockDbSet().Object);
        _userManager.Setup(x => x.CreateAsync(It.IsAny<AppUser>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Error" }));

        var registerDto = new RegisterDto
        {
            Email = "new@test.com",
            Password = "pw",
            FirstName = "New",
            LastName = "User"
        };

        var result = await _controller.Register(registerDto);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // Tests that an authenticated user can retrieve their own profile via GET /api/account.
    // Expected: UserDto with DisplayName "Test User" and a valid JWT token.
    [Fact]
    public async Task GetCurrentUser_ReturnsUserDto()
    {
        var user = TestHelpers.CreateTestUser();
        _userManager.Setup(x => x.FindByEmailAsync(user.Email))
            .ReturnsAsync(user);

        _controller.ControllerContext = TestHelpers.CreateControllerContext(user.Email, user.UserName);

        var result = await _controller.GetCurrentUser();

        result.Value.Should().NotBeNull();
        result.Value.DisplayName.Should().Be("Test User");
        result.Value.Token.Should().NotBeNullOrEmpty();
    }
}

// Helper to create mock DbSet from IQueryable
public static class MockDbSetExtensions
{
    public static Mock<Microsoft.EntityFrameworkCore.DbSet<T>> BuildMockDbSet<T>(this IQueryable<T> source) where T : class
    {
        var mockSet = new Mock<Microsoft.EntityFrameworkCore.DbSet<T>>();

        mockSet.As<IAsyncEnumerable<T>>()
            .Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new TestAsyncEnumerator<T>(source.GetEnumerator()));

        mockSet.As<IQueryable<T>>()
            .Setup(m => m.Provider)
            .Returns(new TestAsyncQueryProvider<T>(source.Provider));

        mockSet.As<IQueryable<T>>().Setup(m => m.Expression).Returns(source.Expression);
        mockSet.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(source.ElementType);
        mockSet.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(source.GetEnumerator());

        return mockSet;
    }
}

internal class TestAsyncQueryProvider<TEntity> : Microsoft.EntityFrameworkCore.Query.IAsyncQueryProvider
{
    private readonly IQueryProvider _inner;

    internal TestAsyncQueryProvider(IQueryProvider inner) => _inner = inner;

    public IQueryable CreateQuery(System.Linq.Expressions.Expression expression)
        => new TestAsyncEnumerable<TEntity>(expression);

    public IQueryable<TElement> CreateQuery<TElement>(System.Linq.Expressions.Expression expression)
        => new TestAsyncEnumerable<TElement>(expression);

    public object Execute(System.Linq.Expressions.Expression expression)
        => _inner.Execute(expression);

    public TResult Execute<TResult>(System.Linq.Expressions.Expression expression)
        => _inner.Execute<TResult>(expression);

    public TResult ExecuteAsync<TResult>(System.Linq.Expressions.Expression expression, CancellationToken cancellationToken = default)
    {
        var expectedResultType = typeof(TResult).GetGenericArguments()[0];
        var executionResult = typeof(IQueryProvider)
            .GetMethod(nameof(IQueryProvider.Execute), 1, new[] { typeof(System.Linq.Expressions.Expression) })
            ?.MakeGenericMethod(expectedResultType)
            .Invoke(this, new object[] { expression });

        return (TResult)typeof(Task).GetMethod(nameof(Task.FromResult))
            ?.MakeGenericMethod(expectedResultType)
            .Invoke(null, new[] { executionResult });
    }
}

internal class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
{
    public TestAsyncEnumerable(IEnumerable<T> enumerable) : base(enumerable) { }
    public TestAsyncEnumerable(System.Linq.Expressions.Expression expression) : base(expression) { }

    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
        => new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());

    IQueryProvider IQueryable.Provider => new TestAsyncQueryProvider<T>(this);
}

internal class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
{
    private readonly IEnumerator<T> _inner;

    public TestAsyncEnumerator(IEnumerator<T> inner) => _inner = inner;

    public ValueTask DisposeAsync()
    {
        _inner.Dispose();
        return ValueTask.CompletedTask;
    }

    public ValueTask<bool> MoveNextAsync() => ValueTask.FromResult(_inner.MoveNext());

    public T Current => _inner.Current;
}
