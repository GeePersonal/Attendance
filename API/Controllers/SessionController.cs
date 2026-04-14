using System.Security.Claims;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.RequestHelpers;
using API.Services;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class SessionController : BaseApiController
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<AppUser> _userManager;
    private readonly TokenService _tokenService;
    private readonly IMapper _mapper;

    public SessionController(ApplicationDbContext context, UserManager<AppUser> userManager, TokenService tokenService, IMapper mapper)
    {
        _mapper = mapper;
        _tokenService = tokenService;
        _userManager = userManager;
        _context = context;
    }

    [Authorize]
    [HttpPost("createSession")]
    public async Task<ActionResult<SessionDto>> CreateSession(CreateSessionDto createSessionDto)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        Class? @class = null;
        if (createSessionDto.ClassId.HasValue)
        {
            @class = await _context.Classes
                .FirstOrDefaultAsync(x => x.Id == createSessionDto.ClassId.Value && x.HostId == user.Id);
            if (@class == null) return BadRequest("Invalid class id");
        }

        var session = new Session
        {
            SessionName = createSessionDto.SessionName,
            SessionExpiresAt = DateTime.UtcNow.AddMinutes(30),
            Host = user!,
            LinkExpiryFreequency = createSessionDto.LinkExpiryFreequency < 30 ? 30 : createSessionDto.LinkExpiryFreequency,
            RegenerateLinkToken = createSessionDto.RegenerateLinkToken,
            Class = @class,
        };

        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        await SetRefereshLinkTokenCookie(session);
        var token = _tokenService.CreateAttendanceLinkToken(session);

        return _mapper.Map<SessionDto>(session, opt => opt.Items["LinkToken"] = token);
    }

    [Authorize]
    [HttpDelete("deleteSession/{sessionId}")]
    public async Task<ActionResult> DeleteSession(string sessionId)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var session = await _context.Sessions
            .FirstOrDefaultAsync(x => x.Id == Guid.Parse(sessionId));

        if (session == null)
        {
            return BadRequest("Invalid session id");
        }

        if (session.Host != user)
        {
            return Unauthorized("You are not authorized to delete this session");
        }

        _context.Sessions.Remove(session);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [Authorize]
    [HttpGet("getSessions")]
    public async Task<ActionResult<PageList<SessionsDto>>> GetSessions([FromQuery] SessionParams sessionParams)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var query = _context.Sessions
            .Include(x => x.Host)
            .Include(x => x.Attendees)
            .Include(x => x.Class)
            .Where(x => x.Host == user)
            .Where(x => sessionParams.ClassId == null || x.ClassId == sessionParams.ClassId)
            .SortSessions(sessionParams.OrderBy ?? "sessionCreatedAtDesc")
            .SearchSessions(sessionParams.SearchTerm)
            .ProjectTo<SessionsDto>(_mapper.ConfigurationProvider)
            .AsNoTracking()
            .AsQueryable();

        var sessionsDtos = await PageList<SessionsDto>.CreateAsync(query, sessionParams.PageNumber, sessionParams.PageSize);

        Response.AddPaginationHeader(sessionsDtos.MetaData);

        return sessionsDtos;
    }

    [Authorize]
    [HttpGet("getSession/{sessionId}")]
    public async Task<ActionResult<SessionDto>> GetSession(string sessionId)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var session = await _context.Sessions
            .Include(x => x.Host)
            .Include(x => x.Class)
            .Where(x => x.Host == user && x.Id == Guid.Parse(sessionId))
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (session == null) return BadRequest("Invalid session id");

        await SetRefereshLinkTokenCookie(session);
        var token = _tokenService.CreateAttendanceLinkToken(session);

        return _mapper.Map<SessionDto>(session, opt => opt.Items["LinkToken"] = token);
    }

    [Authorize]
    [HttpGet("getCurrentSession")]
    public async Task<ActionResult<SessionDto>> GetCurrentSession()
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var session = await _context.Sessions
            .Include(x => x.Host)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(x => x.Host == user);

        if (session == null || session.SessionExpiresAt < DateTime.UtcNow)
        {
            return BadRequest("You do not have any active session");
        }

        await SetRefereshLinkTokenCookie(session);
        var token = _tokenService.CreateAttendanceLinkToken(session);

        return _mapper.Map<SessionDto>(session, opt => opt.Items["LinkToken"] = token);

    }

    [Authorize]
    [HttpPost("refereshLinkToken/{sessionId}")]
    public async Task<ActionResult<SessionDto>> RefereshLinkToken(string sessionId)
    {
        var refereshLinkToken = Request.Cookies["refereshLinkToken"];
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var session = await _context.Sessions
            .Include(x => x.Host)
            .FirstOrDefaultAsync(x => x.Id == Guid.Parse(sessionId) && x.HostId == user.Id);

        if (session == null) return Unauthorized();

        var oldToken = session.RefereshLinkTokens.SingleOrDefault(x => x.Token == refereshLinkToken);
        if (oldToken != null && !oldToken.IsActive) return Unauthorized();

        var token = _tokenService.CreateAttendanceLinkToken(session);

        return _mapper.Map<SessionDto>(session, opt => opt.Items["LinkToken"] = token);
    }

    private async Task SetRefereshLinkTokenCookie(Session session)
    {
        var token = _tokenService.GenerateRefereshLinkToken(session);

        session.RefereshLinkTokens.Add(token);
        await _context.SaveChangesAsync();

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(7),
            IsEssential = true
        };

        Response.Cookies.Append("refereshLinkToken", token.Token, cookieOptions);

    }

    [Authorize]
    [HttpPost("cloneSession/{sessionId}")]
    public async Task<ActionResult<SessionDto>> CloneSession(string sessionId)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var original = await _context.Sessions
            .Include(x => x.Host)
            .Include(x => x.Class)
            .FirstOrDefaultAsync(x => x.Id == Guid.Parse(sessionId) && x.HostId == user.Id);

        if (original == null) return BadRequest("Invalid session id");

        var session = new Session
        {
            SessionName = original.SessionName + " (Copy)",
            SessionExpiresAt = DateTime.UtcNow.AddMinutes(30),
            Host = user!,
            LinkExpiryFreequency = original.LinkExpiryFreequency,
            RegenerateLinkToken = original.RegenerateLinkToken,
            Class = original.Class,
        };

        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        await SetRefereshLinkTokenCookie(session);
        var token = _tokenService.CreateAttendanceLinkToken(session);

        return _mapper.Map<SessionDto>(session, opt => opt.Items["LinkToken"] = token);
    }

    [Authorize]
    [HttpPut("updateSession/{sessionId}")]
    public async Task<ActionResult<SessionDto>> UpdateSession(string sessionId, CreateSessionDto request)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var session = await _context.Sessions
            .Include(x => x.Host)
            .FirstOrDefaultAsync(x => x.Id == Guid.Parse(sessionId) && x.HostId == user.Id);

        if (session == null) return Unauthorized();

        session.SessionName = request.SessionName;
        session.SessionExpiresAt = request.SessionExpiresAt.ToUniversalTime();
        session.LinkExpiryFreequency = request.LinkExpiryFreequency < 30 ? 30 : request.LinkExpiryFreequency;
        session.RegenerateLinkToken = request.RegenerateLinkToken;

        _context.Update(session);
        var updated = await _context.SaveChangesAsync() > 0;

        if (!updated) return BadRequest("Failed to update session");

        await SetRefereshLinkTokenCookie(session);
        var token = _tokenService.CreateAttendanceLinkToken(session);

        return _mapper.Map<SessionDto>(session, opt => opt.Items["LinkToken"] = token);
    }

}
