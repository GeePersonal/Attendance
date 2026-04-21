namespace API.DTOs;

public class AttendeeDto
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string MATNumber { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? ScanLocationName { get; set; }
}
