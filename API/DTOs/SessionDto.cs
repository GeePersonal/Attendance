namespace API.DTOs;

public class SessionDto
{
    public string SessionId { get; set; }
    public string SessionName { get; set; }
    public DateTime SessionExpiresAt { get; set; }
    public string HostName { get; set; }
    public string LinkToken { get; set; } = string.Empty;
    public int AttendeesCount { get; set; }
    public string Status { get; set; }
    public bool RegenerateLinkToken { get; set; }
    public int LinkExpiryFreequency { get; set; }
    public string? ClassId { get; set; }
    public string? ClassName { get; set; }

}
