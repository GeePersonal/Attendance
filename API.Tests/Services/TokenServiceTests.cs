using API.Entities;
using API.Services;
using API.Tests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;

namespace API.Tests.Services;

/// <summary>
/// Unit tests for the TokenService which handles JWT creation, validation,
/// and refresh token generation for both user authentication and attendance links.
/// </summary>
public class TokenServiceTests
{
    private readonly TokenService _tokenService;
    private readonly IConfiguration _config;
    private readonly Mock<Microsoft.AspNetCore.Identity.UserManager<AppUser>> _userManager;

    public TokenServiceTests()
    {
        _config = TestHelpers.CreateTestConfiguration();
        _userManager = TestHelpers.CreateMockUserManager();
        _userManager.Setup(x => x.GetRolesAsync(It.IsAny<AppUser>()))
            .ReturnsAsync(new List<string> { "Host" });
        _tokenService = new TokenService(_userManager.Object, _config);
    }

    // Tests that creating a user JWT token for an authenticated user returns a non-null, non-empty string.
    // Expected: A populated token string.
    [Fact]
    public async Task CreateUserToken_ReturnsNonEmptyToken()
    {
        var user = TestHelpers.CreateTestUser();

        var token = await _tokenService.CreateUserToken(user);

        token.Should().NotBeNullOrEmpty();
    }

    // Tests that the generated user JWT has the correct format: header.payload.signature (3 dot-separated parts).
    // Expected: Token string split by '.' should have exactly 3 segments.
    [Fact]
    public async Task CreateUserToken_ReturnsValidJwtFormat()
    {
        var user = TestHelpers.CreateTestUser();

        var token = await _tokenService.CreateUserToken(user);

        // JWT has 3 parts: header.payload.signature
        token.Split('.').Should().HaveCount(3);
    }

    // Tests that creating an attendance link token for a session returns a non-null, non-empty string.
    // Expected: A populated token string for sharing the attendance link.
    [Fact]
    public void CreateAttendanceLinkToken_ReturnsNonEmptyToken()
    {
        var user = TestHelpers.CreateTestUser();
        var session = TestHelpers.CreateTestSession(user);

        var token = _tokenService.CreateAttendanceLinkToken(session);

        token.Should().NotBeNullOrEmpty();
    }

    // Tests that the attendance link JWT has the correct 3-part format.
    // Expected: Token split by '.' should have exactly 3 segments.
    [Fact]
    public void CreateAttendanceLinkToken_ReturnsValidJwtFormat()
    {
        var user = TestHelpers.CreateTestUser();
        var session = TestHelpers.CreateTestSession(user);

        var token = _tokenService.CreateAttendanceLinkToken(session);

        token.Split('.').Should().HaveCount(3);
    }

    // Tests that a freshly created attendance link token passes validation.
    // Expected: ValidateAttendanceLinkToken returns true for a valid, non-expired token.
    [Fact]
    public void ValidateAttendanceLinkToken_ValidToken_ReturnsTrue()
    {
        var user = TestHelpers.CreateTestUser();
        var session = TestHelpers.CreateTestSession(user, minutesUntilExpiry: 30);

        var token = _tokenService.CreateAttendanceLinkToken(session);
        var result = _tokenService.ValidateAttendanceLinkToken(token);

        result.Should().BeTrue();
    }

    // Tests that a malformed/invalid token string fails validation.
    // Expected: ValidateAttendanceLinkToken returns false.
    [Fact]
    public void ValidateAttendanceLinkToken_InvalidToken_ReturnsFalse()
    {
        var result = _tokenService.ValidateAttendanceLinkToken("invalid.token.here");

        result.Should().BeFalse();
    }

    // Tests that generating a refresh token for a user produces a valid, active token with a future expiry.
    // Expected: Token is non-empty, not expired, and marked as active.
    [Fact]
    public void GenerateRefereshAppUserToken_ReturnsTokenWithFutureExpiry()
    {
        var token = _tokenService.GenerateRefereshAppUserToken();

        token.Should().NotBeNull();
        token.Token.Should().NotBeNullOrEmpty();
        token.Expires.Should().BeAfter(DateTime.UtcNow);
        token.IsExpired.Should().BeFalse();
        token.IsActive.Should().BeTrue();
    }

    // Tests that each call to GenerateRefereshAppUserToken produces a cryptographically unique token.
    // Expected: Two consecutively generated tokens should have different values.
    [Fact]
    public void GenerateRefereshAppUserToken_ReturnsUniqueTokens()
    {
        var token1 = _tokenService.GenerateRefereshAppUserToken();
        var token2 = _tokenService.GenerateRefereshAppUserToken();

        token1.Token.Should().NotBe(token2.Token);
    }

    // Tests that generating a refresh link token for a session produces a valid token with a future expiry.
    // Expected: Token is non-empty with an expiry date after the current time.
    [Fact]
    public void GenerateRefereshLinkToken_ReturnsTokenWithFutureExpiry()
    {
        var user = TestHelpers.CreateTestUser();
        var session = TestHelpers.CreateTestSession(user);

        var token = _tokenService.GenerateRefereshLinkToken(session);

        token.Should().NotBeNull();
        token.Token.Should().NotBeNullOrEmpty();
        token.Expires.Should().BeAfter(DateTime.UtcNow);
    }

    // Tests that when RegenerateLinkToken is false, the refresh link token uses the session's expiry date
    // instead of the short-lived link expiry frequency.
    // Expected: Token expiry should match the session's SessionExpiresAt (within 5 seconds tolerance).
    [Fact]
    public void GenerateRefereshLinkToken_WithRegenerateFalse_UsesSessionExpiry()
    {
        var user = TestHelpers.CreateTestUser();
        var session = TestHelpers.CreateTestSession(user, minutesUntilExpiry: 60);
        session.RegenerateLinkToken = false;

        var token = _tokenService.GenerateRefereshLinkToken(session);

        token.Expires.Should().BeCloseTo(session.SessionExpiresAt, TimeSpan.FromSeconds(5));
    }
}
