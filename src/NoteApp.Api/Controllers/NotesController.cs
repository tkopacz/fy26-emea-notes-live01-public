using Microsoft.AspNetCore.Mvc;
using NoteApp.Api.Models;
using NoteApp.Api.Services;

namespace NoteApp.Api.Controllers;

/// <summary>
/// REST API controller for note operations.
///
/// GET  /api/notes — returns all notes for the requesting user (newest first).
/// POST /api/notes — creates a new immutable note for the requesting user.
///
/// The user identity is taken from the X-User-Id header, which has already
/// been validated and normalised by UserIdValidationMiddleware.
///
/// There are deliberately NO PUT, PATCH, or DELETE endpoints — notes are
/// permanently read-only once created (append-only design).
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class NotesController : ControllerBase
{
    private const string UserIdKey = "X-User-Id";
    private readonly INoteStorageService _storage;
    private readonly ILogger<NotesController> _logger;

    public NotesController(INoteStorageService storage, ILogger<NotesController> logger)
    {
        _storage = storage;
        _logger = logger;
    }

    /// <summary>
    /// Returns all notes for the authenticated user, sorted newest-first.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Note>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetNotes()
    {
        var userId = GetUserId();

        try
        {
            var notes = await _storage.GetNotesAsync(userId);

            // Return newest first — reverse chronological order.
            return Ok(notes.OrderByDescending(n => n.CreatedAt));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Failed to read notes for user {UserId}", userId[..8]);
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = "Could not read notes. The storage file may be corrupt."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error reading notes for user {UserId}", userId[..8]);
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = "An unexpected error occurred while reading notes."
            });
        }
    }

    /// <summary>
    /// Creates a new immutable note for the authenticated user.
    /// The server assigns the Id and CreatedAt — any client-supplied values are ignored.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Note), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateNote([FromBody] CreateNoteRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetUserId();

        // Build the note — Id and CreatedAt are always server-assigned.
        // Trim leading/trailing whitespace; reject if the result is empty.
        var trimmed = request.Content.Trim();
        if (string.IsNullOrEmpty(trimmed))
        {
            ModelState.AddModelError(nameof(request.Content), "Content must not be empty or whitespace.");
            return BadRequest(ModelState);
        }

        var note = new Note
        {
            Id = Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow,
            Content = trimmed,
            ClonedFromId = request.ClonedFromId
        };

        try
        {
            await _storage.AppendNoteAsync(userId, note);
            return CreatedAtAction(nameof(GetNotes), note);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save note for user {UserId}", userId[..8]);
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = "Could not save the note. Please try again."
            });
        }
    }

    // ---------- helpers ----------

    /// <summary>
    /// Retrieves the validated user GUID set by UserIdValidationMiddleware.
    /// This is guaranteed to be present and a valid GUID for all API routes.
    /// </summary>
    private string GetUserId() =>
        HttpContext.Items[UserIdKey]?.ToString()
        ?? throw new InvalidOperationException("User ID not set by middleware.");
}
