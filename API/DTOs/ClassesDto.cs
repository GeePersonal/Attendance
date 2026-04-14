namespace API.DTOs;

public class ClassesDto
{
    public string ClassId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string HostName { get; set; }
    public int SessionsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
