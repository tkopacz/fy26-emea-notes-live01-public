using System.ComponentModel.DataAnnotations;

namespace NoteApp.Api.Models;

/// <summary>
/// Request body for POST /api/notes.
/// The server assigns Id and CreatedAt — clients must NOT provide them.
/// </summary>
public class CreateNoteRequest
{
    /// <summary>The text content to save. Must not be empty or whitespace.</summary>
    [Required]
    [MinLength(1, ErrorMessage = "Content must not be empty.")]
    [MaxLength(50_000, ErrorMessage = "Note content must not exceed 50,000 characters.")]
    public string Content { get; init; } = string.Empty;

    /// <summary>
    /// Optional: the Id of the note this is cloned from.
    /// Records the lineage of cloned notes for traceability.
    /// </summary>
    public string? ClonedFromId { get; init; }
}
