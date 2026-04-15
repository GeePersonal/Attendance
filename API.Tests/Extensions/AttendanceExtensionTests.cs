using API.Entities;
using API.Extensions;
using FluentAssertions;

namespace API.Tests.Extensions;

/// <summary>
/// Unit tests for the AttendanceExtension methods which provide sorting and searching
/// capabilities on IQueryable&lt;Attendee&gt; collections.
/// Uses three test attendees: Alice Smith (123), Charlie Brown (456), Bob Jones (789).
/// </summary>
public class AttendanceExtensionTests
{
    private static IQueryable<Attendee> CreateTestAttendees()
    {
        var sessionId = Guid.NewGuid();
        return new List<Attendee>
        {
            new Attendee { Id = 1, FirstName = "Alice", LastName = "Smith", Email = "alice123@test.com", MATNumber = "123", SessionId = sessionId, CreatedAt = DateTime.UtcNow.AddMinutes(-30) },
            new Attendee { Id = 2, FirstName = "Charlie", LastName = "Brown", Email = "charlie456@test.com", MATNumber = "456", SessionId = sessionId, CreatedAt = DateTime.UtcNow.AddMinutes(-20) },
            new Attendee { Id = 3, FirstName = "Bob", LastName = "Jones", Email = "bob789@test.com", MATNumber = "789", SessionId = sessionId, CreatedAt = DateTime.UtcNow.AddMinutes(-10) },
        }.AsQueryable();
    }

    // Tests sorting attendees by first name in ascending alphabetical order.
    // Expected: Alice, Bob, Charlie.
    [Fact]
    public void SortAttendees_ByFirstNameAsc()
    {
        var attendees = CreateTestAttendees();
        var sorted = attendees.SortSessionAttendees("attendeeFirstNameAsc").ToList();
        sorted.Select(a => a.FirstName).Should().BeInAscendingOrder();
    }

    // Tests sorting attendees by first name in descending alphabetical order.
    // Expected: Charlie, Bob, Alice.
    [Fact]
    public void SortAttendees_ByFirstNameDesc()
    {
        var attendees = CreateTestAttendees();
        var sorted = attendees.SortSessionAttendees("attendeeFirstNameDesc").ToList();
        sorted.Select(a => a.FirstName).Should().BeInDescendingOrder();
    }

    // Tests sorting attendees by last name in ascending alphabetical order.
    // Expected: Brown, Jones, Smith.
    [Fact]
    public void SortAttendees_ByLastNameAsc()
    {
        var attendees = CreateTestAttendees();
        var sorted = attendees.SortSessionAttendees("attendeeLastNameAsc").ToList();
        sorted.Select(a => a.LastName).Should().BeInAscendingOrder();
    }

    // Tests sorting attendees by last name in descending alphabetical order.
    // Expected: Smith, Jones, Brown.
    [Fact]
    public void SortAttendees_ByLastNameDesc()
    {
        var attendees = CreateTestAttendees();
        var sorted = attendees.SortSessionAttendees("attendeeLastNameDesc").ToList();
        sorted.Select(a => a.LastName).Should().BeInDescendingOrder();
    }

    // Tests sorting attendees by email address in ascending order.
    // Expected: alice123@test.com, bob789@test.com, charlie456@test.com.
    [Fact]
    public void SortAttendees_ByEmailAsc()
    {
        var attendees = CreateTestAttendees();
        var sorted = attendees.SortSessionAttendees("attendeeEmailAsc").ToList();
        sorted.Select(a => a.Email).Should().BeInAscendingOrder();
    }

    // Tests sorting attendees by MAT number in ascending order.
    // Expected: 123, 456, 789.
    [Fact]
    public void SortAttendees_ByMATNumberAsc()
    {
        var attendees = CreateTestAttendees();
        var sorted = attendees.SortSessionAttendees("attendeeMATNumberAsc").ToList();
        sorted.Select(a => a.MATNumber).Should().BeInAscendingOrder();
    }

    // Tests sorting attendees by creation date ascending (earliest first).
    // Expected: Alice (30 min ago) first, then Charlie (20 min ago), then Bob (10 min ago).
    [Fact]
    public void SortAttendees_ByCreatedAtAsc()
    {
        var attendees = CreateTestAttendees();
        var sorted = attendees.SortSessionAttendees("attendeeCreatedAtAsc").ToList();
        sorted.Select(a => a.CreatedAt).Should().BeInAscendingOrder();
    }

    // Tests sorting attendees by creation date descending (most recent first).
    // Expected: Bob (10 min ago) first, then Charlie (20 min ago), then Alice (30 min ago).
    [Fact]
    public void SortAttendees_ByCreatedAtDesc()
    {
        var attendees = CreateTestAttendees();
        var sorted = attendees.SortSessionAttendees("attendeeCreatedAtDesc").ToList();
        sorted.Select(a => a.CreatedAt).Should().BeInDescendingOrder();
    }

    // Tests that an unrecognized sort parameter falls back to the default sort (first name ascending).
    // Expected: Alice, Bob, Charlie.
    [Fact]
    public void SortAttendees_DefaultSort_SortsByFirstNameAsc()
    {
        var attendees = CreateTestAttendees();
        var sorted = attendees.SortSessionAttendees("unknownSort").ToList();
        sorted.Select(a => a.FirstName).Should().BeInAscendingOrder();
    }

    // Tests searching attendees by first name.
    // Expected: Only "Alice" is returned.
    [Fact]
    public void SearchAttendees_ByFirstName_FindsMatching()
    {
        var attendees = CreateTestAttendees();
        var result = attendees.SearchSessionAttendees("Alice").ToList();
        result.Should().HaveCount(1);
        result[0].FirstName.Should().Be("Alice");
    }

    // Tests searching attendees by last name.
    // Expected: Only the attendee with last name "Brown" (Charlie) is returned.
    [Fact]
    public void SearchAttendees_ByLastName_FindsMatching()
    {
        var attendees = CreateTestAttendees();
        var result = attendees.SearchSessionAttendees("Brown").ToList();
        result.Should().HaveCount(1);
        result[0].LastName.Should().Be("Brown");
    }

    // Tests searching attendees by a partial email address match.
    // Expected: Only the attendee with email containing "bob789" is returned.
    [Fact]
    public void SearchAttendees_ByEmail_FindsMatching()
    {
        var attendees = CreateTestAttendees();
        var result = attendees.SearchSessionAttendees("bob789").ToList();
        result.Should().HaveCount(1);
        result[0].Email.Should().Contain("bob789");
    }

    // Tests searching attendees by MAT number.
    // Expected: Only the attendee with MATNumber "456" (Charlie) is returned.
    [Fact]
    public void SearchAttendees_ByMATNumber_FindsMatching()
    {
        var attendees = CreateTestAttendees();
        var result = attendees.SearchSessionAttendees("456").ToList();
        result.Should().ContainSingle();
    }

    // Tests that passing null as the search term returns all attendees (no filtering).
    // Expected: All 3 attendees are returned.
    [Fact]
    public void SearchAttendees_NullSearch_ReturnsAll()
    {
        var attendees = CreateTestAttendees();
        var result = attendees.SearchSessionAttendees(null).ToList();
        result.Should().HaveCount(3);
    }

    // Tests that passing an empty string as the search term returns all attendees.
    // Expected: All 3 attendees are returned.
    [Fact]
    public void SearchAttendees_EmptySearch_ReturnsAll()
    {
        var attendees = CreateTestAttendees();
        var result = attendees.SearchSessionAttendees("").ToList();
        result.Should().HaveCount(3);
    }

    // Tests that attendee search is case-insensitive ("alice" matches "Alice").
    // Expected: 1 attendee returned.
    [Fact]
    public void SearchAttendees_CaseInsensitive()
    {
        var attendees = CreateTestAttendees();
        var result = attendees.SearchSessionAttendees("alice").ToList();
        result.Should().HaveCount(1);
    }

    // Tests that searching for a non-existent term returns an empty result set.
    // Expected: 0 attendees returned for "nonexistent".
    [Fact]
    public void SearchAttendees_NoMatch_ReturnsEmpty()
    {
        var attendees = CreateTestAttendees();
        var result = attendees.SearchSessionAttendees("nonexistent").ToList();
        result.Should().BeEmpty();
    }
}
