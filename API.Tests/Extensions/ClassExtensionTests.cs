using API.Entities;
using API.Extensions;
using FluentAssertions;

namespace API.Tests.Extensions;

/// <summary>
/// Unit tests for the ClassExtension methods which provide sorting and searching
/// capabilities on IQueryable&lt;Class&gt; collections.
/// Uses three test classes: Mathematics (3 sessions, oldest), Chemistry (2 sessions), Physics (1 session, newest).
/// </summary>
public class ClassExtensionTests
{
    private static IQueryable<Class> CreateTestClasses()
    {
        var host = new AppUser { Id = "1", FirstName = "Test", LastName = "Host", Email = "host@test.com", UserName = "host@test.com" };
        return new List<Class>
        {
            new Class { Id = Guid.NewGuid(), Name = "Mathematics", Description = "Numbers", CreatedAt = DateTime.UtcNow.AddDays(-3), Host = host, HostId = host.Id, Sessions = new List<Session> { new(), new(), new() } },
            new Class { Id = Guid.NewGuid(), Name = "Physics", Description = "Forces", CreatedAt = DateTime.UtcNow.AddDays(-1), Host = host, HostId = host.Id, Sessions = new List<Session> { new() } },
            new Class { Id = Guid.NewGuid(), Name = "Chemistry", Description = "Elements", CreatedAt = DateTime.UtcNow.AddDays(-2), Host = host, HostId = host.Id, Sessions = new List<Session> { new(), new() } },
        }.AsQueryable();
    }

    // Tests sorting classes by name in ascending alphabetical order.
    // Expected: Classes ordered as Chemistry, Mathematics, Physics.
    [Fact]
    public void SortClasses_ByNameAsc_SortsAlphabetically()
    {
        var classes = CreateTestClasses();
        var sorted = classes.SortClasses("classNameAsc").ToList();
        sorted.Select(c => c.Name).Should().BeInAscendingOrder();
    }

    // Tests sorting classes by name in descending alphabetical order.
    // Expected: Classes ordered as Physics, Mathematics, Chemistry.
    [Fact]
    public void SortClasses_ByNameDesc_SortsReverseAlphabetically()
    {
        var classes = CreateTestClasses();
        var sorted = classes.SortClasses("classNameDesc").ToList();
        sorted.Select(c => c.Name).Should().BeInDescendingOrder();
    }

    // Tests sorting classes by creation date ascending (oldest first).
    // Expected: Mathematics (3 days ago)first, then Chemistry, then Physics.
    [Fact]
    public void SortClasses_ByCreatedAtAsc_SortsByOldestFirst()
    {
        var classes = CreateTestClasses();
        var sorted = classes.SortClasses("classCreatedAtAsc").ToList();
        sorted.Select(c => c.CreatedAt).Should().BeInAscendingOrder();
    }

    // Tests sorting classes by creation date descending (newest first).
    // Expected: Physics (1 day ago) first, then Chemistry, then Mathematics.
    [Fact]
    public void SortClasses_ByCreatedAtDesc_SortsByNewestFirst()
    {
        var classes = CreateTestClasses();
        var sorted = classes.SortClasses("classCreatedAtDesc").ToList();
        sorted.Select(c => c.CreatedAt).Should().BeInDescendingOrder();
    }

    // Tests sorting classes by session count ascending (fewest sessions first).
    // Expected: Physics (1) first, then Chemistry (2), then Mathematics (3).
    [Fact]
    public void SortClasses_BySessionsCountAsc_SortsByLeastFirst()
    {
        var classes = CreateTestClasses();
        var sorted = classes.SortClasses("sessionsCountAsc").ToList();
        sorted.Select(c => c.Sessions.Count).Should().BeInAscendingOrder();
    }

    // Tests sorting classes by session count descending (most sessions first).
    // Expected: Mathematics (3) first, then Chemistry (2), then Physics (1).
    [Fact]
    public void SortClasses_BySessionsCountDesc_SortsByMostFirst()
    {
        var classes = CreateTestClasses();
        var sorted = classes.SortClasses("sessionsCountDesc").ToList();
        sorted.Select(c => c.Sessions.Count).Should().BeInDescendingOrder();
    }

    // Tests that an unrecognized sort parameter falls back to the default sort (created date descending).
    // Expected: Physics (newest) first, then Chemistry, then Mathematics (oldest).
    [Fact]
    public void SortClasses_DefaultSort_SortsByCreatedAtDesc()
    {
        var classes = CreateTestClasses();
        var sorted = classes.SortClasses("unknownSort").ToList();
        sorted.Select(c => c.CreatedAt).Should().BeInDescendingOrder();
    }

    // Tests searching classes by a partial name match.
    // Expected: Only "Mathematics" is returned when searching for "Math".
    [Fact]
    public void SearchClasses_ByName_FindsMatching()
    {
        var classes = CreateTestClasses();
        var result = classes.SearchClasses("Math").ToList();
        result.Should().HaveCount(1);
        result[0].Name.Should().Be("Mathematics");
    }

    // Tests searching classes by their description field.
    // Expected: Only "Chemistry" (description: "Elements") is returned.
    [Fact]
    public void SearchClasses_ByDescription_FindsMatching()
    {
        var classes = CreateTestClasses();
        var result = classes.SearchClasses("Elements").ToList();
        result.Should().HaveCount(1);
        result[0].Name.Should().Be("Chemistry");
    }

    // Tests that passing null as the search term returns all classes (no filtering).
    // Expected: All 3 classes are returned.
    [Fact]
    public void SearchClasses_NullSearch_ReturnsAll()
    {
        var classes = CreateTestClasses();
        var result = classes.SearchClasses(null).ToList();
        result.Should().HaveCount(3);
    }

    // Tests that passing an empty string as the search term returns all classes.
    // Expected: All 3 classes are returned.
    [Fact]
    public void SearchClasses_EmptySearch_ReturnsAll()
    {
        var classes = CreateTestClasses();
        var result = classes.SearchClasses("").ToList();
        result.Should().HaveCount(3);
    }

    // Tests that class search is case-insensitive ("mathematics" matches "Mathematics").
    // Expected: 1 class returned.
    [Fact]
    public void SearchClasses_CaseInsensitive()
    {
        var classes = CreateTestClasses();
        var result = classes.SearchClasses("mathematics").ToList();
        result.Should().HaveCount(1);
    }

    // Tests that searching for a term with no matches returns an empty result set.
    // Expected: 0 classes returned for "Biology".
    [Fact]
    public void SearchClasses_NoMatch_ReturnsEmpty()
    {
        var classes = CreateTestClasses();
        var result = classes.SearchClasses("Biology").ToList();
        result.Should().BeEmpty();
    }
}
