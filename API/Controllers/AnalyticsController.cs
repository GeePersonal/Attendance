using System.Security.Claims;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[Authorize]
public class AnalyticsController : BaseApiController
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<AppUser> _userManager;

    public AnalyticsController(ApplicationDbContext context, UserManager<AppUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    /// <summary>
    /// Overall analytics: total sessions, classes, attendees, recent activity, top sessions.
    /// </summary>
    [HttpGet("overall")]
    public async Task<ActionResult<OverallAnalyticsDto>> GetOverallAnalytics()
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var sessions = await _context.Sessions
            .Include(s => s.Attendees)
            .Include(s => s.Class)
            .Where(s => s.HostId == user.Id)
            .AsNoTracking()
            .ToListAsync();

        var now = DateTime.UtcNow;
        var sevenDaysAgo = now.AddDays(-7);
        var thirtyDaysAgo = now.AddDays(-30);

        var totalAttendees = sessions.Sum(s => s.Attendees.Count);
        var totalSessions = sessions.Count;

        // Daily activity for the last 30 days
        var dailyActivity = sessions
            .Where(s => s.CreatedAt >= thirtyDaysAgo)
            .GroupBy(s => s.CreatedAt.Date)
            .Select(g => new DailyActivityDto
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                SessionsCreated = g.Count(),
                AttendeesRecorded = g.Sum(s => s.Attendees.Count)
            })
            .OrderBy(d => d.Date)
            .ToList();

        var topSessions = sessions
            .OrderByDescending(s => s.Attendees.Count)
            .Take(5)
            .Select(s => new TopSessionDto
            {
                SessionId = s.Id.ToString(),
                SessionName = s.SessionName,
                AttendeesCount = s.Attendees.Count,
                Status = s.SessionExpiresAt > now ? SessionStatus.Active.ToString() : SessionStatus.Expired.ToString(),
                ClassName = s.Class?.Name,
                CreatedAt = s.CreatedAt
            })
            .ToList();

        return new OverallAnalyticsDto
        {
            TotalSessions = totalSessions,
            ActiveSessions = sessions.Count(s => s.SessionExpiresAt > now),
            ExpiredSessions = sessions.Count(s => s.SessionExpiresAt <= now),
            TotalClasses = await _context.Classes.CountAsync(c => c.HostId == user.Id),
            TotalAttendees = totalAttendees,
            AverageAttendeesPerSession = totalSessions > 0 ? Math.Round((double)totalAttendees / totalSessions, 2) : 0,
            SessionsLast7Days = sessions.Count(s => s.CreatedAt >= sevenDaysAgo),
            SessionsLast30Days = sessions.Count(s => s.CreatedAt >= thirtyDaysAgo),
            AttendeesLast7Days = sessions.Where(s => s.CreatedAt >= sevenDaysAgo).Sum(s => s.Attendees.Count),
            AttendeesLast30Days = sessions.Where(s => s.CreatedAt >= thirtyDaysAgo).Sum(s => s.Attendees.Count),
            TopSessionsByAttendees = topSessions,
            DailySessionActivity = dailyActivity
        };
    }

    /// <summary>
    /// Per-session analytics: attendee breakdown by scan location and attendance over time.
    /// </summary>
    [HttpGet("session/{sessionId}")]
    public async Task<ActionResult<SessionAnalyticsDto>> GetSessionAnalytics(string sessionId)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        if (!Guid.TryParse(sessionId, out var sessionGuid))
            return BadRequest("Invalid session id");

        var session = await _context.Sessions
            .Include(s => s.Attendees)
            .Include(s => s.Class)
            .Where(s => s.Id == sessionGuid && s.HostId == user.Id)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (session == null) return NotFound("Session not found");

        var now = DateTime.UtcNow;
        var attendees = session.Attendees.OrderBy(a => a.CreatedAt).ToList();
        var total = attendees.Count;

        // Scan location breakdown
        var locationBreakdown = attendees
            .GroupBy(a => string.IsNullOrWhiteSpace(a.ScanLocationName) ? "Unknown" : a.ScanLocationName)
            .Select(g => new ScanLocationBreakdownDto
            {
                Location = g.Key,
                Count = g.Count(),
                Percentage = total > 0 ? Math.Round((double)g.Count() / total * 100, 2) : 0
            })
            .OrderByDescending(l => l.Count)
            .ToList();

        // Cumulative attendance over time (per minute bucket)
        var overTime = attendees
            .GroupBy(a => new DateTime(a.CreatedAt.Year, a.CreatedAt.Month, a.CreatedAt.Day, a.CreatedAt.Hour, a.CreatedAt.Minute, 0))
            .OrderBy(g => g.Key)
            .Select((g, index) => new { g.Key, Count = g.Count() })
            .ToList();

        var cumulative = new List<AttendanceOverTimeDto>();
        int running = 0;
        foreach (var bucket in overTime)
        {
            running += bucket.Count;
            cumulative.Add(new AttendanceOverTimeDto { Time = bucket.Key, CumulativeCount = running });
        }

        // Average interval between joins (minutes)
        double avgInterval = 0;
        if (attendees.Count > 1)
        {
            var intervals = attendees
                .Zip(attendees.Skip(1), (a, b) => (b.CreatedAt - a.CreatedAt).TotalMinutes)
                .ToList();
            avgInterval = Math.Round(intervals.Average(), 2);
        }

        return new SessionAnalyticsDto
        {
            SessionId = session.Id.ToString(),
            SessionName = session.SessionName,
            Status = session.SessionExpiresAt > now ? SessionStatus.Active.ToString() : SessionStatus.Expired.ToString(),
            CreatedAt = session.CreatedAt,
            SessionExpiresAt = session.SessionExpiresAt,
            ClassId = session.ClassId?.ToString(),
            ClassName = session.Class?.Name,
            TotalAttendees = total,
            AverageJoinIntervalMinutes = avgInterval,
            AttendeesByScanLocation = locationBreakdown,
            AttendeesOverTime = cumulative,
            Attendees = attendees.Select((a, i) => new SessionAttendeeDetailDto
            {
                FirstName = a.FirstName,
                LastName = a.LastName,
                Email = a.Email,
                MATNumber = a.MATNumber,
                JoinedAt = a.CreatedAt,
                ScanLocationName = a.ScanLocationName,
                JoinOrder = i + 1
            }).ToList()
        };
    }

    /// <summary>
    /// Per-class analytics: overall stats plus per-attendee sessions attended and attendance percentage.
    /// </summary>
    [HttpGet("class/{classId}")]
    public async Task<ActionResult<ClassAnalyticsDto>> GetClassAnalytics(string classId)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        if (!Guid.TryParse(classId, out var classGuid))
            return BadRequest("Invalid class id");

        var @class = await _context.Classes
            .Include(c => c.Sessions)
                .ThenInclude(s => s.Attendees)
            .Where(c => c.Id == classGuid && c.HostId == user.Id)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (@class == null) return NotFound("Class not found");

        var now = DateTime.UtcNow;
        var sessions = @class.Sessions;
        var totalSessions = sessions.Count;

        // Build per-session summary
        var sessionBreakdown = sessions
            .OrderBy(s => s.CreatedAt)
            .Select(s => new SessionAttendanceSummaryDto
            {
                SessionId = s.Id.ToString(),
                SessionName = s.SessionName,
                AttendeesCount = s.Attendees.Count,
                Status = s.SessionExpiresAt > now ? SessionStatus.Active.ToString() : SessionStatus.Expired.ToString(),
                CreatedAt = s.CreatedAt
            })
            .ToList();

        // Build per-attendee breakdown using email as unique identifier
        var attendeeMap = new Dictionary<string, ClassAttendeeAnalyticsDto>(StringComparer.OrdinalIgnoreCase);

        foreach (var session in sessions)
        {
            foreach (var attendee in session.Attendees)
            {
                var key = attendee.Email?.ToLower() ?? attendee.MATNumber?.ToLower() ?? attendee.Id.ToString();

                if (!attendeeMap.TryGetValue(key, out var entry))
                {
                    entry = new ClassAttendeeAnalyticsDto
                    {
                        FirstName = attendee.FirstName,
                        LastName = attendee.LastName,
                        Email = attendee.Email,
                        MATNumber = attendee.MATNumber,
                        TotalSessions = totalSessions,
                        SessionsAttended = 0
                    };
                    attendeeMap[key] = entry;
                }
                entry.SessionsAttended++;
                entry.AttendedSessionIds.Add(session.Id.ToString());
            }
        }

        foreach (var entry in attendeeMap.Values)
        {
            entry.AttendancePercentage = totalSessions > 0
                ? Math.Round((double)entry.SessionsAttended / totalSessions * 100, 2)
                : 0;
        }

        var attendeeBreakdown = attendeeMap.Values
            .OrderByDescending(a => a.AttendancePercentage)
            .ThenBy(a => a.LastName)
            .ToList();

        var totalAttendees = sessions.Sum(s => s.Attendees.Count);
        var uniqueAttendees = attendeeMap.Count;
        int maxAttendees = totalSessions > 0 ? sessions.Max(s => s.Attendees.Count) : 0;
        int minAttendees = totalSessions > 0 ? sessions.Min(s => s.Attendees.Count) : 0;

        // Overall attendance rate: actual attendances / (unique attendees * total sessions)
        double overallRate = uniqueAttendees > 0 && totalSessions > 0
            ? Math.Round((double)attendeeBreakdown.Sum(a => a.SessionsAttended) / (uniqueAttendees * totalSessions) * 100, 2)
            : 0;

        return new ClassAnalyticsDto
        {
            ClassId = @class.Id.ToString(),
            ClassName = @class.Name,
            Description = @class.Description,
            TotalSessions = totalSessions,
            TotalUniqueAttendees = uniqueAttendees,
            AverageAttendeesPerSession = totalSessions > 0 ? Math.Round((double)totalAttendees / totalSessions, 2) : 0,
            MaxAttendeesInSession = maxAttendees,
            MinAttendeesInSession = minAttendees,
            OverallAttendanceRate = overallRate,
            AttendeeBreakdown = attendeeBreakdown,
            SessionBreakdown = sessionBreakdown
        };
    }
}
