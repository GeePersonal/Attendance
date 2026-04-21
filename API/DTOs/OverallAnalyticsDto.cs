namespace API.DTOs;

public class OverallAnalyticsDto
{
    public int TotalSessions { get; set; }
    public int ActiveSessions { get; set; }
    public int ExpiredSessions { get; set; }
    public int TotalClasses { get; set; }
    public int TotalAttendees { get; set; }
    public double AverageAttendeesPerSession { get; set; }
    public int SessionsLast7Days { get; set; }
    public int SessionsLast30Days { get; set; }
    public int AttendeesLast7Days { get; set; }
    public int AttendeesLast30Days { get; set; }
    public List<TopSessionDto> TopSessionsByAttendees { get; set; } = new();
    public List<DailyActivityDto> DailySessionActivity { get; set; } = new();
}

public class TopSessionDto
{
    public string SessionId { get; set; }
    public string SessionName { get; set; }
    public int AttendeesCount { get; set; }
    public string Status { get; set; }
    public string? ClassName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DailyActivityDto
{
    public string Date { get; set; }
    public int SessionsCreated { get; set; }
    public int AttendeesRecorded { get; set; }
}
