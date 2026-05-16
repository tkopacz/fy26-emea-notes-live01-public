namespace NoteApp.Api.Models;

/// <summary>
/// Represents an immutable note stored in the system.
/// Once created, a note is never modified or deleted — it is append-only.
/// </summary>
public class Note
{
    /// <summary>Server-assigned UUID v4 identifier for this note.</summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>UTC timestamp of when the note was created (ISO-8601 format).</summary>
    public DateTime CreatedAt { get; init; }

    /// <summary>The text content of the note.</summary>
    public string Content { get; init; } = string.Empty;

    /// <summary>
    /// Optional: the Id of the note this was cloned from.
    /// Null if this is an original note.
    /// </summary>
    public string? ClonedFromId { get; init; }
}
