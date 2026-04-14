namespace API.DTOs;

public class CreateSessionDto
{
    public string SessionName { get; set; }
    public DateTime SessionExpiresAt { get; set; }
    public int LinkExpiryFreequency { get; set; }
    public bool RegenerateLinkToken { get; set; }
    public Guid? ClassId { get; set; }
}
