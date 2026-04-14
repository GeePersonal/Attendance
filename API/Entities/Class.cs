using System.ComponentModel.DataAnnotations;

namespace API.Entities;
public class Class
{
    public Guid Id { get; set; }
    public string HostId { get; set; }
    public AppUser Host { get; set; }
    [Required]
    [MaxLength(100)]
    [MinLength(3)]
    public string Name { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<Session> Sessions { get; set; } = new List<Session>();

    public int SessionsCount { get { return Sessions.Count; } }
}
