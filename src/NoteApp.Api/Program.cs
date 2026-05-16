using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using NoteApp.Api.Middleware;
using NoteApp.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// -----------------------------------------------------------------------
// Services
// -----------------------------------------------------------------------

// Register controllers for the notes API.
builder.Services.AddControllers();

// Register Swagger for developer convenience in development mode.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// NoteStorageService is a singleton so that the per-file SemaphoreSlim
// dictionary is shared across all requests — essential for correct locking.
builder.Services.AddSingleton<INoteStorageService, NoteStorageService>();

// --- Security: CORS ---
// Restrict API access to the SPA origin only (configurable per environment).
// Defaults to the Vite dev server in development, production domain otherwise.
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("SpaOnly", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .WithMethods("GET", "POST")  // only the two verbs we expose
              .DisallowCredentials();
    });
});

// --- Security: Rate limiting ---
// Prevents DoS attacks and storage exhaustion from a single client.
// 60 requests per minute per IP; returns 429 when exceeded.
var rateLimitSection = builder.Configuration.GetSection("RateLimiting");
var permitLimit  = rateLimitSection.GetValue<int>("PermitLimit",  60);
var windowSeconds = rateLimitSection.GetValue<int>("WindowSeconds", 60);

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", o =>
    {
        o.Window       = TimeSpan.FromSeconds(windowSeconds);
        o.PermitLimit  = permitLimit;
        o.QueueLimit   = 0;  // reject immediately when limit is hit
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

var app = builder.Build();

// -----------------------------------------------------------------------
// Middleware pipeline
// -----------------------------------------------------------------------

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Apply CORS before any API processing so preflight (OPTIONS) requests are
// handled correctly and cross-origin requests to the API are blocked.
app.UseCors("SpaOnly");

// Serve the React SPA from wwwroot/ (built by Vite in production).
// IMPORTANT: UseStaticFiles must be registered BEFORE the SPA fallback
// so that API requests are NOT served as static files.
app.UseDefaultFiles();
app.UseStaticFiles();

// Apply rate limiting to all routes.
app.UseRateLimiter();

// Validate X-User-Id header for all /api/* routes.
app.UseMiddleware<UserIdValidationMiddleware>();

// Map attribute-routed controllers (NotesController → /api/notes).
// RequireRateLimiting applies the "api" policy to all controller actions.
app.MapControllers().RequireRateLimiting("api");

// SPA fallback: any non-API, non-static-file route returns index.html
// so that React Router handles client-side navigation.
app.MapFallbackToFile("index.html");

app.Run();

// Expose Program as a partial class so WebApplicationFactory<Program>
// can reference it in integration tests.
public partial class Program { }
