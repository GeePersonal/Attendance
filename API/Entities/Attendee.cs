namespace API.Entities;
public class Attendee
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string MATNumber { get; set; }
    public Guid SessionId { get; set; }
    public Session Session { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? ScanLocationName { get; set; }
}
