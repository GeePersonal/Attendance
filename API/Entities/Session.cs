using System.ComponentModel.DataAnnotations;
using API.Enums;

namespace API.Entities;
public class Session
{
    public Guid Id { get; set; }
    public string HostId { get; set; }
    public AppUser Host { get; set; }
    [Required]
    [MaxLength(50)]
    [MinLength(3)]
    public string SessionName { get; set; }
    [Required]
    public DateTime SessionExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool RegenerateLinkToken { get; set; } = true;
    public int LinkExpiryFreequency { get; set; } = 30;
    public Guid? ClassId { get; set; }
    public Class? Class { get; set; }
    public List<Attendee> Attendees { get; set; } = new List<Attendee>();

    public List<RefereshLinkToken> RefereshLinkTokens { get; set; } = new List<RefereshLinkToken>();

    public int AttendeesCount { get { return Attendees.Count; } }

    public string Status { get { return SessionExpiresAt > DateTime.UtcNow ? SessionStatus.Active.ToString() : SessionStatus.Expired.ToString(); } }
}