using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using SecureWatch.Api.Configuration;
using SecureWatch.Api.Data;
using SecureWatch.Api.Middleware;
using SecureWatch.Api.Repositories;
using SecureWatch.Api.Services;

var builder = WebApplication.CreateBuilder(args);
LoadLocalDotEnv(builder.Configuration, builder.Environment);

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()!;
if (string.IsNullOrWhiteSpace(jwt.Key) || jwt.Key.Length < 32)
{
    throw new InvalidOperationException("JWT_KEY must be configured with at least 32 characters.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IPasswordPolicy, PasswordPolicy>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ILogAnalysisService, LogAnalysisService>();
builder.Services.AddScoped<IIpReputationService, IpReputationService>();
builder.Services.AddScoped<ICveLookupService, CveLookupService>();
builder.Services.AddScoped<IAiRecommendationService, AiRecommendationService>();
builder.Services.AddScoped<IEmailAlertService, EmailAlertService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<DataSeeder>();
builder.Services.AddHttpClient();

builder.Services.AddHttpClient<ISecurityEngineClient, SecurityEngineClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["SecurityEngine:BaseUrl"]!);
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("auth", limiter =>
    {
        limiter.PermitLimit = 10;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiter.QueueLimit = 0;
    });
});
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider.GetRequiredService<DataSeeder>().SeedAsync();
}

app.Run();

static void LoadLocalDotEnv(ConfigurationManager configuration, IWebHostEnvironment environment)
{
    var envPath = Path.GetFullPath(Path.Combine(environment.ContentRootPath, "..", ".env"));
    if (!File.Exists(envPath))
    {
        return;
    }

    var aliases = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["ABUSEIPDB_API_KEY"] = "AbuseIPDB:ApiKey",
        ["NVD_API_KEY"] = "Nvd:ApiKey",
        ["OPENAI_API_KEY"] = "OpenAI:ApiKey",
        ["OPENAI_MODEL"] = "OpenAI:Model",
        ["JWT_KEY"] = "Jwt:Key",
        ["JWT_EXPIRES_MINUTES"] = "Jwt:ExpiresMinutes",
        ["JWT_REFRESH_TOKEN_DAYS"] = "Jwt:RefreshTokenDays",
        ["SMTP_HOST"] = "Smtp:Host",
        ["SMTP_PORT"] = "Smtp:Port",
        ["SMTP_USERNAME"] = "Smtp:Username",
        ["SMTP_PASSWORD"] = "Smtp:Password",
        ["SMTP_FROM"] = "Smtp:From",
        ["SMTP_TO"] = "Smtp:To"
    };

    var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
    foreach (var line in File.ReadAllLines(envPath))
    {
        var trimmed = line.Trim();
        if (trimmed.Length == 0 || trimmed.StartsWith('#') || !trimmed.Contains('='))
        {
            continue;
        }

        var separator = trimmed.IndexOf('=');
        var key = trimmed[..separator].Trim();
        var value = trimmed[(separator + 1)..].Trim().Trim('"');

        if (aliases.TryGetValue(key, out var configKey))
        {
            values[configKey] = value;
        }
    }

    configuration.AddInMemoryCollection(values);
}
