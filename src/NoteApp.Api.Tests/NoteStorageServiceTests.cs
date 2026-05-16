using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using NoteApp.Api.Models;
using NoteApp.Api.Services;

namespace NoteApp.Api.Tests;

/// <summary>
/// Unit tests for NoteStorageService.
/// Uses a temporary directory for each test to ensure full isolation
/// without mocking the file system.
/// </summary>
public class NoteStorageServiceTests : IDisposable
{
    // Each test gets its own temp directory so tests never interfere.
    private readonly string _tempDir;
    private readonly string _dataDir;
    private readonly NoteStorageService _sut;

    public NoteStorageServiceTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), $"noteapp_tests_{Guid.NewGuid():N}");
        _dataDir = Path.Combine(_tempDir, "data");
        Directory.CreateDirectory(_tempDir);

        // Pass the isolated temp data directory so tests never touch a shared path.
        _sut = new NoteStorageService(NullLogger<NoteStorageService>.Instance, _dataDir);
    }

    public void Dispose()
    {
        // Clean up temp directory after each test.
        if (Directory.Exists(_tempDir))
        {
            try { Directory.Delete(_tempDir, recursive: true); }
            catch { /* best-effort cleanup — ignore if file still locked */ }
        }
    }

    // -----------------------------------------------------------------------
    // GetNotesAsync
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetNotesAsync_NoFileExists_ReturnsEmptyList()
    {
        // Arrange — no file for this GUID
        var guid = Guid.NewGuid().ToString();

        // Act
        var notes = await _sut.GetNotesAsync(guid);

        // Assert
        Assert.Empty(notes);
    }

    [Fact]
    public async Task GetNotesAsync_FileWithNotes_ReturnsAllNotes()
    {
        // Arrange — create a user file with two notes directly.
        var guid = Guid.NewGuid().ToString();
        var expectedNotes = new[]
        {
            new Note { Id = "id-1", CreatedAt = DateTime.UtcNow.AddMinutes(-10), Content = "First note" },
            new Note { Id = "id-2", CreatedAt = DateTime.UtcNow, Content = "Second note" }
        };
        WriteUserFile(guid, expectedNotes);

        // Act
        var notes = await _sut.GetNotesAsync(guid);

        // Assert — both notes returned in stored order (controller sorts by date).
        Assert.Equal(2, notes.Count);
        Assert.Equal("id-1", notes[0].Id);
        Assert.Equal("id-2", notes[1].Id);
    }

    [Fact]
    public async Task GetNotesAsync_CorruptFile_ThrowsInvalidOperationException()
    {
        // Arrange — write invalid JSON to the user's file.
        var guid = Guid.NewGuid().ToString();
        Directory.CreateDirectory(_dataDir);
        await File.WriteAllTextAsync(Path.Combine(_dataDir, $"{guid}.json"), "not valid json {{{{");

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.GetNotesAsync(guid));
    }

    // -----------------------------------------------------------------------
    // AppendNoteAsync
    // -----------------------------------------------------------------------

    [Fact]
    public async Task AppendNoteAsync_NewUser_CreatesFileWithOneNote()
    {
        // Arrange
        var guid = Guid.NewGuid().ToString();
        var note = new Note { Id = "note-1", CreatedAt = DateTime.UtcNow, Content = "Hello" };

        // Act
        await _sut.AppendNoteAsync(guid, note);

        // Assert — file exists and contains exactly one note.
        var notes = await _sut.GetNotesAsync(guid);
        Assert.Single(notes);
        Assert.Equal("note-1", notes[0].Id);
        Assert.Equal("Hello", notes[0].Content);
    }

    [Fact]
    public async Task AppendNoteAsync_ExistingUser_AppendsToExistingNotes()
    {
        // Arrange — seed the user with one note.
        var guid = Guid.NewGuid().ToString();
        var first = new Note { Id = "note-1", CreatedAt = DateTime.UtcNow.AddMinutes(-5), Content = "First" };
        WriteUserFile(guid, new[] { first });

        var second = new Note { Id = "note-2", CreatedAt = DateTime.UtcNow, Content = "Second" };

        // Act
        await _sut.AppendNoteAsync(guid, second);

        // Assert — file now has two notes in order.
        var notes = await _sut.GetNotesAsync(guid);
        Assert.Equal(2, notes.Count);
        Assert.Equal("note-1", notes[0].Id);
        Assert.Equal("note-2", notes[1].Id);
    }

    [Fact]
    public async Task AppendNoteAsync_NotePreservesClonedFromId()
    {
        // Arrange
        var guid = Guid.NewGuid().ToString();
        var note = new Note
        {
            Id = "note-clone",
            CreatedAt = DateTime.UtcNow,
            Content = "Cloned content",
            ClonedFromId = "original-id"
        };

        // Act
        await _sut.AppendNoteAsync(guid, note);

        // Assert
        var notes = await _sut.GetNotesAsync(guid);
        Assert.Single(notes);
        Assert.Equal("original-id", notes[0].ClonedFromId);
    }

    [Fact]
    public async Task AppendNoteAsync_DataDirectoryCreatedAutomatically()
    {
        // Arrange — ensure data/ does NOT exist before the call.
        if (Directory.Exists(_dataDir)) Directory.Delete(_dataDir, true);

        var guid = Guid.NewGuid().ToString();
        var note = new Note { Id = "n1", CreatedAt = DateTime.UtcNow, Content = "test" };

        // Act
        await _sut.AppendNoteAsync(guid, note);

        // Assert — directory was created.
        Assert.True(Directory.Exists(_dataDir));
    }

    [Fact]
    public async Task AppendNoteAsync_ConcurrentWrites_AllNotesPersistedWithoutCorruption()
    {
        // Arrange — simulate multiple browser tabs writing simultaneously.
        var guid = Guid.NewGuid().ToString();
        const int concurrentTasks = 20;

        var tasks = Enumerable.Range(0, concurrentTasks).Select(i =>
            _sut.AppendNoteAsync(guid, new Note
            {
                Id = $"note-{i}",
                CreatedAt = DateTime.UtcNow,
                Content = $"Concurrent note {i}"
            }));

        // Act
        await Task.WhenAll(tasks);

        // Assert — all 20 notes were written without corruption.
        var notes = await _sut.GetNotesAsync(guid);
        Assert.Equal(concurrentTasks, notes.Count);
        Assert.All(notes, n => Assert.NotNull(n.Id));
    }

    // -----------------------------------------------------------------------
    // Security: path traversal guard
    // -----------------------------------------------------------------------

    [Theory]
    [InlineData("../../etc/passwd")]
    [InlineData("..\\..\\appsettings.json")]
    [InlineData("../secret")]
    public async Task GetNotesAsync_PathTraversalAttempt_ThrowsUnauthorizedAccessException(string maliciousGuid)
    {
        // The GUID has already been validated by middleware, so this test covers
        // defence-in-depth: the service itself must refuse paths outside _dataDir.
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _sut.GetNotesAsync(maliciousGuid));
    }

    [Theory]
    [InlineData("../../etc/passwd")]
    [InlineData("../secret")]
    public async Task AppendNoteAsync_PathTraversalAttempt_ThrowsUnauthorizedAccessException(string maliciousGuid)
    {
        var note = new Note { Id = "x", CreatedAt = DateTime.UtcNow, Content = "hack" };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _sut.AppendNoteAsync(maliciousGuid, note));
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /// <summary>Writes a user JSON file directly, bypassing the service (for test setup).</summary>
    private void WriteUserFile(string guid, IEnumerable<Note> notes)
    {
        Directory.CreateDirectory(_dataDir);
        var json = JsonSerializer.Serialize(notes, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        File.WriteAllText(Path.Combine(_dataDir, $"{guid}.json"), json);
    }
}
