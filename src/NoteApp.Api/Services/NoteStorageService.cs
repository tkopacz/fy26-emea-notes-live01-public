using System.Collections.Concurrent;
using System.Text.Json;
using NoteApp.Api.Models;

namespace NoteApp.Api.Services;

/// <summary>
/// Implements flat-file JSON storage for notes.
///
/// Storage layout: data/{guid}.json — a JSON array of Note objects.
/// New notes are appended; the file is never overwritten in-place.
///
/// Thread safety: a per-file SemaphoreSlim prevents concurrent writes
/// from multiple browser tabs of the same user.
///
/// Atomic writes: data is written to a temp file then renamed to avoid
/// partial-write corruption on process crash or power failure.
/// </summary>
public class NoteStorageService : INoteStorageService
{
    // Directory (relative to working dir) where user JSON files are stored.
    private const string DataDir = "data";

    // JSON serialization options — use camelCase to match the React client.
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    // One SemaphoreSlim per user GUID ensures serialised access to each file.
    // Using a concurrent dictionary avoids a global lock.
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _fileLocks = new();

    private readonly ILogger<NoteStorageService> _logger;
    // The data directory path — configurable for testing; defaults to "data" relative to working dir.
    private readonly string _dataDir;

    public NoteStorageService(ILogger<NoteStorageService> logger, string? dataDirectory = null)
    {
        _logger = logger;
        _dataDir = dataDirectory ?? DataDir;
    }

    /// <inheritdoc/>
    public async Task<IReadOnlyList<Note>> GetNotesAsync(string userGuid)
    {
        var filePath = GetFilePath(userGuid);

        if (!File.Exists(filePath))
        {
            // No notes yet — return empty list (not an error).
            return Array.Empty<Note>();
        }

        try
        {
            var json = await File.ReadAllTextAsync(filePath);
            var notes = JsonSerializer.Deserialize<List<Note>>(json, JsonOptions);
            return notes ?? new List<Note>();
        }
        catch (JsonException ex)
        {
            // Log truncated GUID per privacy policy — only first 8 characters.
            _logger.LogError(ex, "Corrupt JSON for user {UserId}", TruncateGuid(userGuid));
            throw new InvalidOperationException($"Note file for user is corrupt.", ex);
        }
    }

    /// <inheritdoc/>
    public async Task AppendNoteAsync(string userGuid, Note note)
    {
        // Ensure the data directory exists before any file operations.
        Directory.CreateDirectory(_dataDir);

        var filePath = GetFilePath(userGuid);

        // Acquire per-file lock — prevents concurrent writes from multiple tabs.
        var sem = _fileLocks.GetOrAdd(userGuid, _ => new SemaphoreSlim(1, 1));
        await sem.WaitAsync();
        try
        {
            // Read existing notes (or start with empty list for new user).
            List<Note> notes;
            if (File.Exists(filePath))
            {
                var existing = await File.ReadAllTextAsync(filePath);
                notes = JsonSerializer.Deserialize<List<Note>>(existing, JsonOptions)
                        ?? new List<Note>();
            }
            else
            {
                notes = new List<Note>();
            }

            notes.Add(note);

            // Atomic write: write to a temp file in the same directory,
            // then rename (move) over the target. File.Move with overwrite:true
            // is atomic on most OS/FS combinations.
            var tempPath = filePath + ".tmp";
            var serialized = JsonSerializer.Serialize(notes, JsonOptions);
            await File.WriteAllTextAsync(tempPath, serialized);
            File.Move(tempPath, filePath, overwrite: true);

            _logger.LogInformation(
                "Note {NoteId} appended for user {UserId}",
                note.Id,
                TruncateGuid(userGuid));
        }
        finally
        {
            sem.Release();
        }
    }

    // ---------- helpers ----------

    /// <summary>
    /// Returns the full canonical path to the user's JSON file.
    /// Asserts the resolved path is inside _dataDir to prevent path traversal,
    /// even though userGuid has already been validated as a GUID by middleware.
    /// This is a defence-in-depth guard that costs essentially nothing.
    /// </summary>
    private string GetFilePath(string userGuid)
    {
        // Resolve both paths to their absolute canonical forms.
        var fullDataDir = Path.GetFullPath(_dataDir);
        var filePath    = Path.GetFullPath(Path.Combine(fullDataDir, $"{userGuid}.json"));

        // The file must reside directly inside the data directory — not in a subdirectory,
        // not above it.  A crafted GUID like "../../etc/passwd" would fail here.
        if (!filePath.StartsWith(fullDataDir + Path.DirectorySeparatorChar,
                                 StringComparison.OrdinalIgnoreCase))
        {
            // Log without the full GUID to avoid leaking potentially crafted values.
            _logger.LogWarning("Path traversal attempt blocked for user path outside data dir.");
            throw new UnauthorizedAccessException("Invalid file path resolved outside the data directory.");
        }

        return filePath;
    }

    /// <summary>
    /// Returns only the first 8 characters of a GUID for use in log messages,
    /// per the data privacy requirement (full GUIDs must not appear in logs).
    /// </summary>
    private static string TruncateGuid(string guid) =>
        guid.Length >= 8 ? guid[..8] : guid;
}
