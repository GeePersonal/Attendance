namespace API.DTOs;

public class ClassAnalyticsDto
{
    public string ClassId { get; set; }
    public string ClassName { get; set; }
    public string? Description { get; set; }
    public int TotalSessions { get; set; }
    public int TotalUniqueAttendees { get; set; }
    public double AverageAttendeesPerSession { get; set; }
    public int MaxAttendeesInSession { get; set; }
    public int MinAttendeesInSession { get; set; }
    public double OverallAttendanceRate { get; set; }
    public List<ClassAttendeeAnalyticsDto> AttendeeBreakdown { get; set; } = new();
    public List<SessionAttendanceSummaryDto> SessionBreakdown { get; set; } = new();
}

public class ClassAttendeeAnalyticsDto
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string MATNumber { get; set; }
    public int SessionsAttended { get; set; }
    public int TotalSessions { get; set; }
    public double AttendancePercentage { get; set; }
    /// <summary>Which session IDs this attendee was present in (used to render the register matrix).</summary>
    public List<string> AttendedSessionIds { get; set; } = new();
}

public class SessionAttendanceSummaryDto
{
    public string SessionId { get; set; }
    public string SessionName { get; set; }
    public int AttendeesCount { get; set; }
    public string Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
