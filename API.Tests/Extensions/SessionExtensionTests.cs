using API.Entities;
using API.Extensions;
using FluentAssertions;

namespace API.Tests.Extensions;

/// <summary>
/// Unit tests for the SessionExtension methods which provide sorting and searching
/// capabilities on IQueryable&lt;Session&gt; collections.
/// Uses three test sessions: Alpha (3 attendees, oldest), Bravo (2 attendees), Charlie (1 attendee, newest).
/// </summary>
public class SessionExtensionTests
{
    private static IQueryable<Session> CreateTestSessions()
    {
        var host = new AppUser { Id = "1", FirstName = "Test", LastName = "Host", Email = "host@test.com", UserName = "host@test.com" };
        return new List<Session>
        {
            new Session { Id = Guid.NewGuid(), SessionName = "Alpha", CreatedAt = DateTime.UtcNow.AddDays(-3), SessionExpiresAt = DateTime.UtcNow.AddDays(1), Host = host, HostId = host.Id, Attendees = new List<Attendee> { new(), new(), new() } },
            new Session { Id = Guid.NewGuid(), SessionName = "Charlie", CreatedAt = DateTime.UtcNow.AddDays(-1), SessionExpiresAt = DateTime.UtcNow.AddDays(3), Host = host, HostId = host.Id, Attendees = new List<Attendee> { new() } },
            new Session { Id = Guid.NewGuid(), SessionName = "Bravo", CreatedAt = DateTime.UtcNow.AddDays(-2), SessionExpiresAt = DateTime.UtcNow.AddDays(2), Host = host, HostId = host.Id, Attendees = new List<Attendee> { new(), new() } },
        }.AsQueryable();
    }

    // Tests sorting sessions by name in ascending order.
    // Expected: Sessions ordered as Alpha, Bravo, Charlie.
    [Fact]
    public void SortSessions_ByNameAsc_SortsAlphabetically()
    {
        var sessions = CreateTestSessions();
        var sorted = sessions.SortSessions("sessionNameAsc").ToList();
        sorted.Select(s => s.SessionName).Should().BeInAscendingOrder();
    }

    // Tests sorting sessions by name in descending order.
    // Expected: Sessions ordered as Charlie, Bravo, Alpha.
    [Fact]
    public void SortSessions_ByNameDesc_SortsReverseAlphabetically()
    {
        var sessions = CreateTestSessions();
        var sorted = sessions.SortSessions("sessionNameDesc").ToList();
        sorted.Select(s => s.SessionName).Should().BeInDescendingOrder();
    }

    // Tests sorting sessions by creation date ascending (oldest first).
    // Expected: Alpha (3 days ago) first, then Bravo (2 days ago), then Charlie (1 day ago).
    [Fact]
    public void SortSessions_ByCreatedAtAsc_SortsByOldestFirst()
    {
        var sessions = CreateTestSessions();
        var sorted = sessions.SortSessions("sessionCreatedAtAsc").ToList();
        sorted.Select(s => s.CreatedAt).Should().BeInAscendingOrder();
    }

    // Tests sorting sessions by creation date descending (newest first).
    // Expected: Charlie (1 day ago) first, then Bravo (2 days ago), then Alpha (3 days ago).
    [Fact]
    public void SortSessions_ByCreatedAtDesc_SortsByNewestFirst()
    {
        var sessions = CreateTestSessions();
        var sorted = sessions.SortSessions("sessionCreatedAtDesc").ToList();
        sorted.Select(s => s.CreatedAt).Should().BeInDescendingOrder();
    }

    // Tests sorting sessions by attendee count ascending (fewest attendees first).
    // Expected: Charlie (1) first, then Bravo (2), then Alpha (3).
    [Fact]
    public void SortSessions_ByAttendeesCountAsc_SortsByLeastFirst()
    {
        var sessions = CreateTestSessions();
        var sorted = sessions.SortSessions("attendeesCountAsc").ToList();
        sorted.Select(s => s.Attendees.Count).Should().BeInAscendingOrder();
    }

    // Tests sorting sessions by attendee count descending (most attendees first).
    // Expected: Alpha (3) first, then Bravo (2), then Charlie (1).
    [Fact]
    public void SortSessions_ByAttendeesCountDesc_SortsByMostFirst()
    {
        var sessions = CreateTestSessions();
        var sorted = sessions.SortSessions("attendeesCountDesc").ToList();
        sorted.Select(s => s.Attendees.Count).Should().BeInDescendingOrder();
    }

    // Tests that an unrecognized sort parameter falls back to the default sort (name ascending).
    // Expected: Sessions ordered as Alpha, Bravo, Charlie.
    [Fact]
    public void SortSessions_DefaultSort_SortsByNameAsc()
    {
        var sessions = CreateTestSessions();
        var sorted = sessions.SortSessions("unknownSort").ToList();
        sorted.Select(s => s.SessionName).Should().BeInAscendingOrder();
    }

    // Tests searching sessions by an exact session name match.
    // Expected: Only the "Alpha" session is returned.
    [Fact]
    public void SearchSessions_ByName_FindsMatching()
    {
        var sessions = CreateTestSessions();
        var result = sessions.SearchSessions("Alpha").ToList();
        result.Should().HaveCount(1);
        result[0].SessionName.Should().Be("Alpha");
    }

    // Tests that passing null as the search term returns all sessions (no filtering).
    // Expected: All 3 sessions are returned.
    [Fact]
    public void SearchSessions_NullSearch_ReturnsAll()
    {
        var sessions = CreateTestSessions();
        var result = sessions.SearchSessions(null).ToList();
        result.Should().HaveCount(3);
    }

    // Tests that passing an empty string as the search term returns all sessions.
    // Expected: All 3 sessions are returned.
    [Fact]
    public void SearchSessions_EmptySearch_ReturnsAll()
    {
        var sessions = CreateTestSessions();
        var result = sessions.SearchSessions("").ToList();
        result.Should().HaveCount(3);
    }

    // Tests that session search is case-insensitive ("alpha" matches "Alpha").
    // Expected: 1 session returned.
    [Fact]
    public void SearchSessions_CaseInsensitive()
    {
        var sessions = CreateTestSessions();
        var result = sessions.SearchSessions("alpha").ToList();
        result.Should().HaveCount(1);
    }
}
