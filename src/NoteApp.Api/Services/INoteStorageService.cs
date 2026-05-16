using NoteApp.Api.Models;

namespace NoteApp.Api.Services;

/// <summary>
/// Abstraction over flat-file JSON note storage.
/// Injected into controllers so storage can be mocked in tests.
/// </summary>
public interface INoteStorageService
{
    /// <summary>
    /// Returns all notes for the given user GUID, in the order they were stored.
    /// Returns an empty list if no notes exist yet.
    /// Throws <see cref="InvalidOperationException"/> if the file is corrupt.
    /// </summary>
    Task<IReadOnlyList<Note>> GetNotesAsync(string userGuid);

    /// <summary>
    /// Atomically appends a new note to the user's JSON file.
    /// Creates the file (and the data/ directory) if they do not exist.
    /// </summary>
    Task AppendNoteAsync(string userGuid, Note note);
}
