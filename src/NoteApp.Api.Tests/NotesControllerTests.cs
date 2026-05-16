using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using NoteApp.Api.Models;
using NoteApp.Api.Services;

namespace NoteApp.Api.Tests;

/// <summary>
/// Integration tests for NotesController using WebApplicationFactory.
/// The storage service is mocked so no real file I/O occurs.
/// Tests cover: header validation, GET/POST behaviour, error handling.
/// </summary>
public class NotesControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    // A valid GUID used as the test user identity.
    private const string TestUserId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

    public NotesControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    // -----------------------------------------------------------------------
    // X-User-Id header validation (GH-007)
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetNotes_MissingUserIdHeader_Returns400()
    {
        var client = CreateClientWithMockStorage(mock => { });

        var response = await client.GetAsync("/api/notes");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostNotes_MissingUserIdHeader_Returns400()
    {
        var client = CreateClientWithMockStorage(mock => { });

        var response = await client.PostAsJsonAsync("/api/notes",
            new CreateNoteRequest { Content = "Test" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("not-a-guid")]
    [InlineData("12345")]
    [InlineData("")]
    [InlineData("  ")]
    public async Task GetNotes_InvalidUserIdHeader_Returns400(string invalidId)
    {
        var client = CreateClientWithMockStorage(mock => { });
        client.DefaultRequestHeaders.Add("X-User-Id", invalidId);

        var response = await client.GetAsync("/api/notes");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // -----------------------------------------------------------------------
    // GET /api/notes (GH-003)
    // -----------------------------------------------------------------------

    [Fact]
    public async Task GetNotes_ValidUser_ReturnsNotesNewestFirst()
    {
        // Arrange — two notes: older first in storage, newer second.
        var older = new Note { Id = "n1", CreatedAt = DateTime.UtcNow.AddHours(-2), Content = "Old" };
        var newer = new Note { Id = "n2", CreatedAt = DateTime.UtcNow, Content = "New" };

        var client = CreateClientWithMockStorage(mock =>
        {
            mock.Setup(s => s.GetNotesAsync(It.IsAny<string>()))
                .ReturnsAsync(new List<Note> { older, newer });
        });
        client.DefaultRequestHeaders.Add("X-User-Id", TestUserId);

        // Act
        var response = await client.GetAsync("/api/notes");

        // Assert — HTTP 200 + notes in newest-first order.
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var notes = await response.Content.ReadFromJsonAsync<List<Note>>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(notes);
        Assert.Equal(2, notes.Count);
        Assert.Equal("n2", notes[0].Id); // newer first
        Assert.Equal("n1", notes[1].Id);
    }

    [Fact]
    public async Task GetNotes_EmptyUser_Returns200WithEmptyArray()
    {
        var client = CreateClientWithMockStorage(mock =>
        {
            mock.Setup(s => s.GetNotesAsync(It.IsAny<string>()))
                .ReturnsAsync(Array.Empty<Note>());
        });
        client.DefaultRequestHeaders.Add("X-User-Id", TestUserId);

        var response = await client.GetAsync("/api/notes");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var notes = await response.Content.ReadFromJsonAsync<List<Note>>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.Empty(notes!);
    }

    [Fact]
    public async Task GetNotes_StorageThrows_Returns500()
    {
        var client = CreateClientWithMockStorage(mock =>
        {
            mock.Setup(s => s.GetNotesAsync(It.IsAny<string>()))
                .ThrowsAsync(new InvalidOperationException("Corrupt file"));
        });
        client.DefaultRequestHeaders.Add("X-User-Id", TestUserId);

        var response = await client.GetAsync("/api/notes");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    // -----------------------------------------------------------------------
    // POST /api/notes (GH-002, GH-004, GH-005)
    // -----------------------------------------------------------------------

    [Fact]
    public async Task PostNotes_ValidRequest_Returns201WithNote()
    {
        Note? capturedNote = null;

        var client = CreateClientWithMockStorage(mock =>
        {
            // Capture the note that gets appended so we can assert on it.
            mock.Setup(s => s.AppendNoteAsync(It.IsAny<string>(), It.IsAny<Note>()))
                .Callback<string, Note>((_, n) => capturedNote = n)
                .Returns(Task.CompletedTask);
        });
        client.DefaultRequestHeaders.Add("X-User-Id", TestUserId);

        var response = await client.PostAsJsonAsync("/api/notes",
            new { content = "Hello world" });

        // Assert response.
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // Assert server-assigned fields.
        Assert.NotNull(capturedNote);
        Assert.False(string.IsNullOrEmpty(capturedNote!.Id));
        Assert.True(Guid.TryParse(capturedNote.Id, out _)); // Server assigns a GUID
        Assert.Equal("Hello world", capturedNote.Content);
        Assert.Null(capturedNote.ClonedFromId);
    }

    [Fact]
    public async Task PostNotes_WithClonedFromId_PersistsCloneRelationship()
    {
        Note? capturedNote = null;

        var client = CreateClientWithMockStorage(mock =>
        {
            mock.Setup(s => s.AppendNoteAsync(It.IsAny<string>(), It.IsAny<Note>()))
                .Callback<string, Note>((_, n) => capturedNote = n)
                .Returns(Task.CompletedTask);
        });
        client.DefaultRequestHeaders.Add("X-User-Id", TestUserId);

        await client.PostAsJsonAsync("/api/notes",
            new { content = "Cloned note", clonedFromId = "original-id" });

        Assert.NotNull(capturedNote);
        Assert.Equal("original-id", capturedNote!.ClonedFromId);
    }

    [Fact]
    public async Task PostNotes_EmptyContent_Returns400()
    {
        var client = CreateClientWithMockStorage(mock => { });
        client.DefaultRequestHeaders.Add("X-User-Id", TestUserId);

        var response = await client.PostAsJsonAsync("/api/notes",
            new { content = "   " }); // whitespace only after trim

        // Model validation should reject empty/whitespace content.
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostNotes_StorageThrows_Returns500()
    {
        var client = CreateClientWithMockStorage(mock =>
        {
            mock.Setup(s => s.AppendNoteAsync(It.IsAny<string>(), It.IsAny<Note>()))
                .ThrowsAsync(new IOException("Disk full"));
        });
        client.DefaultRequestHeaders.Add("X-User-Id", TestUserId);

        var response = await client.PostAsJsonAsync("/api/notes",
            new { content = "Test note" });

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task PostNotes_ServerAssignsIdAndCreatedAt_ClientSuppliedValuesIgnored()
    {
        // The API must ignore any id or createdAt fields the client sends.
        // (CreateNoteRequest intentionally has no Id or CreatedAt properties.)
        Note? capturedNote = null;

        var client = CreateClientWithMockStorage(mock =>
        {
            mock.Setup(s => s.AppendNoteAsync(It.IsAny<string>(), It.IsAny<Note>()))
                .Callback<string, Note>((_, n) => capturedNote = n)
                .Returns(Task.CompletedTask);
        });
        client.DefaultRequestHeaders.Add("X-User-Id", TestUserId);

        // Send a raw JSON body that includes id/createdAt — they should be ignored.
        var json = """{"content":"Test","id":"injected-id","createdAt":"2000-01-01T00:00:00Z"}""";
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        await client.PostAsync("/api/notes", content);

        Assert.NotNull(capturedNote);
        // Server-assigned Id must NOT be the one the client injected.
        Assert.NotEqual("injected-id", capturedNote!.Id);
        // Server-assigned date must be recent (within 5 seconds of now).
        Assert.True((DateTime.UtcNow - capturedNote.CreatedAt).TotalSeconds < 5);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /// <summary>
    /// Creates an HttpClient backed by a WebApplicationFactory that replaces
    /// INoteStorageService with a Moq mock configured by <paramref name="configure"/>.
    /// Sets a temporary content root to satisfy PhysicalFileProvider in tests.
    /// </summary>
    private HttpClient CreateClientWithMockStorage(Action<Mock<INoteStorageService>> configure)
    {
        var mock = new Mock<INoteStorageService>();
        configure(mock);

        return _factory.WithWebHostBuilder(builder =>
        {
            // Point the content root at a temp dir so static file middleware
            // doesn't fail when wwwroot/ doesn't exist in the test environment.
            builder.UseContentRoot(Path.GetTempPath());

            builder.ConfigureServices(services =>
            {
                // Remove the real singleton and replace with the mock.
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(INoteStorageService));
                if (descriptor != null)
                    services.Remove(descriptor);

                services.AddSingleton(mock.Object);
            });
        }).CreateClient();
    }
}
