namespace API.DTOs;

public class SessionsDto
{
    public string SessionId { get; set; }
    public string SessionName { get; set; }
    public DateTime SessionExpiresAt { get; set; }
    public string HostName { get; set; }
    public int AttendeesCount { get; set; }
    public string Status { get; set; }
    public string? ClassId { get; set; }
    public string? ClassName { get; set; }
}
