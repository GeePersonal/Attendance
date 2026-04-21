namespace API.DTOs;

public class SessionAnalyticsDto
{
    public string SessionId { get; set; }
    public string SessionName { get; set; }
    public string Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime SessionExpiresAt { get; set; }
    public string? ClassId { get; set; }
    public string? ClassName { get; set; }
    public int TotalAttendees { get; set; }
    public double AverageJoinIntervalMinutes { get; set; }
    public List<ScanLocationBreakdownDto> AttendeesByScanLocation { get; set; } = new();
    public List<AttendanceOverTimeDto> AttendeesOverTime { get; set; } = new();
    public List<SessionAttendeeDetailDto> Attendees { get; set; } = new();
}

public class SessionAttendeeDetailDto
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string MATNumber { get; set; }
    public DateTime JoinedAt { get; set; }
    public string? ScanLocationName { get; set; }
    public int JoinOrder { get; set; }
}

public class ScanLocationBreakdownDto
{
    public string Location { get; set; }
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class AttendanceOverTimeDto
{
    public DateTime Time { get; set; }
    public int CumulativeCount { get; set; }
}
