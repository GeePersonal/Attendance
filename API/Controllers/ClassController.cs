using System.Security.Claims;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.RequestHelpers;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class ClassController : BaseApiController
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<AppUser> _userManager;
    private readonly IMapper _mapper;

    public ClassController(ApplicationDbContext context, UserManager<AppUser> userManager, IMapper mapper)
    {
        _mapper = mapper;
        _userManager = userManager;
        _context = context;
    }

    [Authorize]
    [HttpPost("createClass")]
    public async Task<ActionResult<ClassDto>> CreateClass(CreateClassDto createClassDto)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var @class = new Class
        {
            Name = createClassDto.Name,
            Description = createClassDto.Description,
            Host = user!,
        };

        _context.Classes.Add(@class);
        await _context.SaveChangesAsync();

        return _mapper.Map<ClassDto>(@class);
    }

    [Authorize]
    [HttpGet("getClasses")]
    public async Task<ActionResult<PageList<ClassesDto>>> GetClasses([FromQuery] ClassParams classParams)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var query = _context.Classes
            .Include(x => x.Host)
            .Include(x => x.Sessions)
            .Where(x => x.Host == user)
            .SortClasses(classParams.OrderBy ?? "classCreatedAtDesc")
            .SearchClasses(classParams.SearchTerm)
            .ProjectTo<ClassesDto>(_mapper.ConfigurationProvider)
            .AsNoTracking()
            .AsQueryable();

        var classesDtos = await PageList<ClassesDto>.CreateAsync(query, classParams.PageNumber, classParams.PageSize);

        Response.AddPaginationHeader(classesDtos.MetaData);

        return classesDtos;
    }

    [Authorize]
    [HttpGet("getClass/{classId}")]
    public async Task<ActionResult<ClassDto>> GetClass(string classId)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var @class = await _context.Classes
            .Include(x => x.Host)
            .Include(x => x.Sessions)
            .Where(x => x.Host == user && x.Id == Guid.Parse(classId))
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (@class == null) return BadRequest("Invalid class id");

        return _mapper.Map<ClassDto>(@class);
    }

    [Authorize]
    [HttpPut("updateClass/{classId}")]
    public async Task<ActionResult<ClassDto>> UpdateClass(string classId, CreateClassDto request)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var @class = await _context.Classes
            .Include(x => x.Host)
            .Include(x => x.Sessions)
            .FirstOrDefaultAsync(x => x.Id == Guid.Parse(classId) && x.HostId == user.Id);

        if (@class == null) return Unauthorized();

        @class.Name = request.Name;
        @class.Description = request.Description;

        _context.Update(@class);
        var updated = await _context.SaveChangesAsync() > 0;

        if (!updated) return BadRequest("Failed to update class");

        return _mapper.Map<ClassDto>(@class);
    }

    [Authorize]
    [HttpDelete("deleteClass/{classId}")]
    public async Task<ActionResult> DeleteClass(string classId)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var @class = await _context.Classes
            .FirstOrDefaultAsync(x => x.Id == Guid.Parse(classId));

        if (@class == null) return BadRequest("Invalid class id");

        if (@class.HostId != user.Id) return Unauthorized("You are not authorized to delete this class");

        _context.Classes.Remove(@class);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [Authorize]
    [HttpPost("addSessionToClass/{classId}/{sessionId}")]
    public async Task<ActionResult> AddSessionToClass(string classId, string sessionId)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var @class = await _context.Classes
            .FirstOrDefaultAsync(x => x.Id == Guid.Parse(classId) && x.HostId == user.Id);

        if (@class == null) return BadRequest("Invalid class id");

        var session = await _context.Sessions
            .FirstOrDefaultAsync(x => x.Id == Guid.Parse(sessionId) && x.HostId == user.Id);

        if (session == null) return BadRequest("Invalid session id");

        session.ClassId = @class.Id;
        await _context.SaveChangesAsync();

        return Ok();
    }

    [Authorize]
    [HttpDelete("removeSessionFromClass/{classId}/{sessionId}")]
    public async Task<ActionResult> RemoveSessionFromClass(string classId, string sessionId)
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var session = await _context.Sessions
            .FirstOrDefaultAsync(x => x.Id == Guid.Parse(sessionId) && x.HostId == user.Id && x.ClassId == Guid.Parse(classId));

        if (session == null) return BadRequest("Invalid session or class id");

        session.ClassId = null;
        await _context.SaveChangesAsync();

        return Ok();
    }
}
