using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SecureWatch.Api.Configuration;
using SecureWatch.Api.Data;
using SecureWatch.Api.Middleware;
using SecureWatch.Api.Repositories;
using SecureWatch.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()!;

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider.GetRequiredService<DataSeeder>().SeedAsync();
}

app.Run();
