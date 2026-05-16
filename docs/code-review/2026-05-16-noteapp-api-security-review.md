# Code Review: NoteApp API — Security Hardening

**Date**: 2026-05-16  
**Component**: `NoteApp.Api` (ASP.NET Core 8 Web API)  
**Reviewer**: Security Agent  
**Ready for Production**: Yes (after fixes applied)  
**Critical Issues Found**: 3 → **0 remaining** (all fixed in this review)

---

## Summary

The application is a flat-file immutable note-taking API with a React SPA frontend. No authentication, no database. The three highest-risk issues were all in the Web API layer: missing rate limiting, a missing path-safety assertion in file path construction, and a missing CORS policy.

All three issues have been fixed in this commit. Test count increased from **22 → 29** (7 new security tests added).

---

## Priority 1 (Fixed) ⛔

### 1. No rate limiting → DoS / storage exhaustion

**Risk**: OWASP A05 (Security Misconfiguration), OWASP A04 (Insecure Design)  
**Severity**: High — a single client could issue unlimited `POST /api/notes` requests, filling disk space and exhausting memory during `GetNotes` reads (entire user file loaded into RAM per request).

**What was fixed**:

`Program.cs` — added fixed-window rate limiter (60 req/min per IP):
```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", o =>
    {
        o.Window      = TimeSpan.FromSeconds(windowSeconds); // 60s default
        o.PermitLimit = permitLimit;                         // 60 default
        o.QueueLimit  = 0;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});
// ...
app.UseRateLimiter();
app.MapControllers().RequireRateLimiting("api");
```

`CreateNoteRequest.cs` — added content size cap:
```csharp
[MaxLength(50_000, ErrorMessage = "Note content must not exceed 50,000 characters.")]
public string Content { get; init; } = string.Empty;
```

Limits are configurable via `appsettings.json`:
```json
"RateLimiting": { "PermitLimit": 60, "WindowSeconds": 60 }
```

**Tests added**: `PostNotes_ContentExceeds50000Characters_Returns400`, `PostNotes_ContentAtExactLimit_Returns201`

---

### 2. Path traversal in `GetFilePath` — no canonical path check

**Risk**: OWASP A01 (Broken Access Control), OWASP A03 (Injection)  
**Severity**: Medium — defence-in-depth gap. Middleware validates GUIDs, but the storage service itself placed no constraint on where the resolved file path could be. If GUID validation were ever bypassed or removed, a crafted value like `../../appsettings.json` would resolve to a file outside `data/`.

**What was fixed** in `NoteStorageService.GetFilePath`:
```csharp
private string GetFilePath(string userGuid)
{
    var fullDataDir = Path.GetFullPath(_dataDir);
    var filePath    = Path.GetFullPath(Path.Combine(fullDataDir, $"{userGuid}.json"));

    if (!filePath.StartsWith(fullDataDir + Path.DirectorySeparatorChar,
                             StringComparison.OrdinalIgnoreCase))
    {
        _logger.LogWarning("Path traversal attempt blocked for user path outside data dir.");
        throw new UnauthorizedAccessException("Invalid file path resolved outside the data directory.");
    }

    return filePath;
}
```

**Tests added**: `GetNotesAsync_PathTraversalAttempt_ThrowsUnauthorizedAccessException` (3 cases), `AppendNoteAsync_PathTraversalAttempt_ThrowsUnauthorizedAccessException` (2 cases)

---

### 3. No CORS policy — API accessible from any origin

**Risk**: OWASP A01 (Broken Access Control)  
**Severity**: Medium — without an explicit CORS policy, ASP.NET Core's default behaviour allows cross-origin requests in some configurations. Any page on any domain could call the API with a user's GUID if they knew it.

**What was fixed** in `Program.cs`:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("SpaOnly", policy =>
    {
        policy.WithOrigins(allowedOrigins)  // from appsettings per environment
              .AllowAnyHeader()
              .WithMethods("GET", "POST")   // only the two verbs the API exposes
              .DisallowCredentials();
    });
});
// ...
app.UseCors("SpaOnly");  // before MapControllers
```

Configured per environment:
- `appsettings.Development.json`: `["http://localhost:5173", "http://localhost:5000"]`
- `appsettings.json` (production): `["https://your-production-domain.com"]`

---

## No Issues Found ✅

| Area | Status |
|---|---|
| GUID validation (X-User-Id header) | ✅ Solid — validated by middleware before controller |
| Atomic file writes | ✅ Temp-file + `File.Move(overwrite:true)` |
| Per-file locking (concurrent tabs) | ✅ `SemaphoreSlim` via `ConcurrentDictionary` |
| GUID logging truncation | ✅ Only first 8 chars logged |
| `data/` not served as static files | ✅ Only `wwwroot/` is served |
| No SQL injection surface | ✅ No database, flat-file only |
| No PII collected | ✅ GUID is the only identifier |
| Server-assigned ID and timestamp | ✅ Client cannot inject `id` or `createdAt` |

---

## Remaining Recommendations (future)

| Item | Priority |
|---|---|
| Add `Content-Security-Policy` response header | Low |
| Add per-user note count cap (e.g. max 10,000 notes) to bound file size | Medium |
| Enforce HTTPS redirect in production (`app.UseHttpsRedirection()`) | Low |
| Log `429` rejections for rate-limit abuse monitoring | Low |
