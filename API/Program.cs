using System.Text;
using API.Data;
using API.Entities;
using API.Middleware;
using API.RequestHelpers;
using API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

Encoding.RegisterProvider(CodePagesEncodingProvider.Instance); // For pdf font support

builder.Services.AddControllers();
builder.Services.AddAutoMapper(typeof(MappingProfiles).Assembly);
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
    {
        var jwtSecurityScheme = new OpenApiSecurityScheme
        {
            BearerFormat = "JWT",
            Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer",
            Reference = new OpenApiReference
            {
                Id = JwtBearerDefaults.AuthenticationScheme,
                Type = ReferenceType.SecurityScheme
            }
        };
        c.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, jwtSecurityScheme);
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                { jwtSecurityScheme, Array.Empty<string>() }
            });
    }
);

builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
        ?? new[] { "http://localhost:5173", "https://localhost:7231" };

    options.AddPolicy("CorsPolicy",
        builder => builder
        .WithOrigins(allowedOrigins)
        .AllowAnyMethod()
        .AllowCredentials()
        .AllowAnyHeader()
        .WithExposedHeaders("WWW-Authenticate", "Pagination"));
});

string connString;
if (builder.Environment.IsDevelopment())
    connString = builder.Configuration.GetConnectionString("DefaultConnection");
else
{
    // First check for a direct connection string (Neon, Supabase, etc.)
    connString = Environment.GetEnvironmentVariable("CONNECTION_STRING");

    if (string.IsNullOrEmpty(connString))
    {
        // Fallback: parse DATABASE_URL (postgres:// format)
        var connUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

        connUrl = connUrl.Replace("postgres://", string.Empty);
        string pgUserPass = connUrl.Split("@")[0];
        string pgHostPortDb = connUrl.Split("@")[1];
        string pgHostPort = pgHostPortDb.Split("/")[0];
        string pgDb = pgHostPortDb.Split("/")[1];
        string pgUser = pgUserPass.Split(":")[0];
        string pgPass = pgUserPass.Split(":")[1];
        string pgHost = pgHostPort.Split(":")[0];
        string pgPort = pgHostPort.Split(":")[1];

        connString = $"Server={pgHost};Port={pgPort};User Id={pgUser};Password={pgPass};Database={pgDb}";
    }
}

builder.Services.AddDbContext<ApplicationDbContext>(opt =>
{
    opt.UseNpgsql(connString);
});

builder.Services.AddIdentityCore<AppUser>(options =>
{
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireDigit = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
    options.Password.RequiredLength = 4;
})
    .AddRoles<IdentityRole>()
    .AddRoleManager<RoleManager<IdentityRole>>()
    .AddSignInManager<SignInManager<AppUser>>()
    .AddRoleValidator<RoleValidator<IdentityRole>>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JWTSettings:TokenKey"])),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<TokenService>();

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();

//security headers
app.UseXContentTypeOptions();
app.UseReferrerPolicy(opt => opt.NoReferrer());
app.UseXXssProtection(opt => opt.EnabledWithBlockMode());
app.UseXfo(opt => opt.Deny());

app.UseCspReportOnly(opt => opt
    .BlockAllMixedContent()
    // .StyleSources(s => s.Self().CustomSources("https://accounts.google.com/gsi/style", "sha256-2B6D2cgxXR6e7ocmg13tWpNPBrKNcPH7zmj+c3HcrQY=", "sha256-lmto2U1o7YINyHPg9TOCjIt+o5pSFNU/T2oLxDPF+uw="))
    .FontSources(s => s.Self())
    .FormActions(s => s.Self())
    .FrameAncestors(s => s.Self())
    .ImageSources(s => s.Self().CustomSources("https://lh3.googleusercontent.com"))
    .ScriptSources(s => s.Self().CustomSources("https://accounts.google.com/gsi/client")));

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.ConfigObject.AdditionalItems.Add("persistAuthorization", true);
    });
}
else
{
    // app.UseHsts(); for some reason this have not been working
    app.Use(async (context, next) =>
    {
        context.Response.Headers.Add("Strict-Transport-Security", "max-age=31536000");
        await next();
    });
}

app.UseCors("CorsPolicy");

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", () => Results.Ok("healthy"));
app.MapFallbackToController("Index", "Fallback");

using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;

try
{
    var context = services.GetRequiredService<ApplicationDbContext>();
    var userManager = services.GetRequiredService<UserManager<AppUser>>();
    await context.Database.MigrateAsync();
    await context.SeedAsync(userManager);
}
catch (Exception ex)
{
    var logger = services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "An error occurred during migration");
}

app.Run();
