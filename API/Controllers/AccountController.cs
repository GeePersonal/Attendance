using System.Security.Claims;
using API.DTOs;
using API.Entities;
using API.Services;
using AutoMapper;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class AccountController : BaseApiController
{
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly TokenService _tokenService;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;
    public AccountController(UserManager<AppUser> userManager,
                             SignInManager<AppUser> signInManager,
                             TokenService tokenService, IMapper mapper,
                             IConfiguration configuration)
    {
        _mapper = mapper;
        _signInManager = signInManager;
        _userManager = userManager;
        _tokenService = tokenService;
        _configuration = configuration;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
    {
        var user = await _userManager.FindByEmailAsync(loginDto.Email);

        if (user == null) return Unauthorized("Invalid email or password");

        var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);

        if (!result.Succeeded)
        {
            return Unauthorized("Invalid email or password");
        }

        var token = await _tokenService.CreateUserToken(user);

        await SetRefereshAppUserTokenCookie(user);
        return _mapper.Map<UserDto>(user, opt => opt.Items["AppUserToken"] = token);

    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult> Register(RegisterDto registerDto)
    {
        if (await _userManager.Users.AnyAsync(x => x.Email == registerDto.Email))
        {
            return BadRequest("User name or Email taken");
        }

        var user = new AppUser
        {
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
            Email = registerDto.Email,
            UserName = registerDto.Email,
        };

        var result = await _userManager.CreateAsync(user, registerDto.Password);

        if (result.Succeeded)
        {
            var token = await _tokenService.CreateUserToken(user);
            return Created("user", _mapper.Map<UserDto>(user, opt => opt.Items["AppUserToken"] = token));
        }

        return BadRequest("Problem registering user");
    }

    [AllowAnonymous]
    [HttpPost("googleLogin")]
    public async Task<ActionResult<UserDto>> GoogleLogin(string accessToken)
    {
        var payload = await GoogleJsonWebSignature.ValidateAsync(accessToken, 
    new GoogleJsonWebSignature.ValidationSettings 
    { 
        Audience = new[] { _configuration["Google:ClientId"] } 
    });
        if (payload == null)
        {
            return BadRequest("Invalid access token");
        }

        var user = await _userManager.FindByEmailAsync(payload.Email);

        if (user == null)
        {
            user = new AppUser
            {

                Email = payload.Email,
                UserName = payload.Email,
                FirstName = payload.GivenName,
                LastName = payload.FamilyName,
                ProfileImageUrl = payload.Picture
            };

            var result = await _userManager.CreateAsync(user);

            if (!result.Succeeded) return BadRequest("Problem creating user account");
        }

        var token = await _tokenService.CreateUserToken(user);
        await SetRefereshAppUserTokenCookie(user);
        return _mapper.Map<UserDto>(user, opt => opt.Items["AppUserToken"] = token);
    }

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

        var token = await _tokenService.CreateUserToken(user);
        return _mapper.Map<UserDto>(user, opt => opt.Items["AppUserToken"] = token);
    }

    [Authorize]
    [HttpPost("refereshAppUserToken")]
    public async Task<ActionResult<UserDto>> RefereshAppUserToken()
    {
        var refereshAppUserToken = Request.Cookies["refereshAppUserToken"];
        var user = await _userManager.Users
        .Include(r => r.RefreshAppUserTokens)
        .FirstOrDefaultAsync(x => x.UserName == User.FindFirstValue(ClaimTypes.Name));
        if (user == null) return Unauthorized();

        var oldToken = user.RefreshAppUserTokens.SingleOrDefault(x => x.Token == refereshAppUserToken);
        if (oldToken != null && !oldToken.IsActive) return Unauthorized();

        await SetRefereshAppUserTokenCookie(user);
        var token = await _tokenService.CreateUserToken(user);
        return _mapper.Map<UserDto>(user, opt => opt.Items["AppUserToken"] = token);
    }

    private async Task SetRefereshAppUserTokenCookie(AppUser user)
    {
        var refereshAppUserToken = _tokenService.GenerateRefereshAppUserToken();
        user.RefreshAppUserTokens.Add(refereshAppUserToken);
        await _userManager.UpdateAsync(user);

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(7),
            IsEssential = true
        };
        Response.Cookies.Append("refereshAppUserToken", refereshAppUserToken.Token, cookieOptions);
    }
}
