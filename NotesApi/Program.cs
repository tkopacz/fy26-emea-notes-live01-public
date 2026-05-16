var builder = WebApplication.CreateBuilder(args);

const string ReactDevCorsPolicy = "ReactDevClient";
const string ReactDevServerOrigin = "http://localhost:5173";

// Register the minimal services needed for the Phase 1 API scaffold.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddCors(options =>
{
    options.AddPolicy(ReactDevCorsPolicy, policy =>
    {
        policy.WithOrigins(ReactDevServerOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Swagger stays available for local development and manual API exploration.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(ReactDevCorsPolicy);

// Simple liveness endpoint used by local smoke tests and future automation.
app.MapHealthChecks("/health");

app.Run();
