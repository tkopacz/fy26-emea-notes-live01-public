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

var app = builder.Build();

// -----------------------------------------------------------------------
// Middleware pipeline
// -----------------------------------------------------------------------

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Serve the React SPA from wwwroot/ (built by Vite in production).
// IMPORTANT: UseStaticFiles must be registered BEFORE the SPA fallback
// so that API requests are NOT served as static files.
app.UseDefaultFiles();
app.UseStaticFiles();

// Validate X-User-Id header for all /api/* routes.
app.UseMiddleware<UserIdValidationMiddleware>();

// Map attribute-routed controllers (NotesController → /api/notes).
app.MapControllers();

// SPA fallback: any non-API, non-static-file route returns index.html
// so that React Router handles client-side navigation.
app.MapFallbackToFile("index.html");

app.Run();

// Expose Program as a partial class so WebApplicationFactory<Program>
// can reference it in integration tests.
public partial class Program { }
