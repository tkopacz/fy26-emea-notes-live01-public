namespace NoteApp.Api.Middleware;

/// <summary>
/// ASP.NET Core middleware that validates the X-User-Id request header.
///
/// Every API endpoint requires a valid GUID in this header to scope
/// storage reads and writes to the correct user file.
///
/// Returns 400 Bad Request immediately if the header is absent or malformed,
/// preventing invalid requests from reaching the controllers.
/// </summary>
public class UserIdValidationMiddleware
{
    private const string UserIdHeader = "X-User-Id";
    private readonly RequestDelegate _next;

    public UserIdValidationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only validate API routes — skip static files and the SPA fallback.
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue(UserIdHeader, out var headerValues)
            || string.IsNullOrWhiteSpace(headerValues.FirstOrDefault()))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = $"The '{UserIdHeader}' header is required."
            });
            return;
        }

        var rawId = headerValues.First()!.Trim();

        // Validate that the header value is a well-formed GUID.
        if (!Guid.TryParse(rawId, out _))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = $"The '{UserIdHeader}' header must be a valid GUID."
            });
            return;
        }

        // Store the normalised (lower-case, no-braces) GUID in HttpContext.Items
        // so controllers can read it without re-parsing the header.
        context.Items[UserIdHeader] = rawId.ToLowerInvariant();

        await _next(context);
    }
}
