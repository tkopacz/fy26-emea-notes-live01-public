# NoteApp

> An immutable note-taking app that lets each browser user capture append-only notes without creating an account.

## Overview

NoteApp is a full-stack web application for recording timestamped notes that become read-only as soon as they are saved. The backend stores each user's notes in a dedicated JSON file, while the frontend keeps a browser-scoped GUID in local storage and uses it on every API request.

The app is designed for low-friction personal note capture, audit-style history, and quick iteration through note cloning rather than editing. In production, the ASP.NET Core API can also serve the built SPA from `wwwroot`.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | ASP.NET Core 8 Web API |
| Frontend | React 19, TypeScript, Vite |
| Storage | Per-user JSON files in `data\` |
| Testing | xUnit, ASP.NET Core test host, Vitest, Testing Library |
| Runtime tooling | Node.js with `concurrently`, .NET SDK 8 |

## Project Structure

```text
.
|-- client\                     # React + Vite SPA
|   |-- src\
|   |   |-- api\               # Fetch wrapper for /api/notes
|   |   |-- components\        # Header, compose area, note cards, banners
|   |   |-- hooks\             # User identity and note loading/saving
|   |   `-- __tests__\         # Frontend unit tests
|-- docs\code-review\          # Supplemental review notes
|-- src\
|   |-- NoteApp.Api\           # ASP.NET Core API and production SPA host
|   `-- NoteApp.Api.Tests\     # Backend tests
|-- NoteApp.slnx               # Solution entry point
|-- package.json               # Root runner for API + client together
|-- prd.md                     # Product requirements
`-- start.cmd                  # Windows shortcut for npm start
```

## Prerequisites

- .NET 8 SDK
- Node.js
- npm

## Getting Started

The quickest way to run the full app on Windows is:

```powershell
npm install
npm --prefix client install
.\start.cmd
```

That launches:

- The API at `http://localhost:5000`
- The Vite client at `http://localhost:5173`

Open `http://localhost:5173` in your browser.

## Running the App

### Single-command local run

```powershell
npm start
```

The root `start` script runs both processes with `concurrently`:

- `dotnet run --project src\NoteApp.Api\NoteApp.Api.csproj --no-launch-profile --urls http://localhost:5000`
- `npm --prefix client run dev`

### Run the backend only

```powershell
dotnet run --project src\NoteApp.Api\NoteApp.Api.csproj --no-launch-profile --urls http://localhost:5000
```

### Run the frontend only

```powershell
npm --prefix client run dev
```

## Testing

```powershell
dotnet test .\NoteApp.slnx
npm --prefix client test
```

## API Reference

All API requests require the `X-User-Id` header containing a valid GUID.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notes` | Returns the current user's notes in reverse chronological order |
| POST | `/api/notes` | Creates a new immutable note from `{ content, clonedFromId? }` |

In development, Swagger UI is available from the API host.

## Key Design Decisions

- **Immutable notes**: the API exposes only `GET` and `POST`; there are no edit or delete endpoints.
- **GUID-based identity**: the client generates and persists a browser-local identifier instead of using login flows.
- **Append-only file storage**: notes are stored per user in `data\{guid}.json`.
- **Atomic writes**: the storage layer writes to a temporary file and then replaces the target file to reduce corruption risk.
- **Per-user locking**: a `SemaphoreSlim` is used per user file to prevent concurrent writes from multiple tabs.
- **Backend-served SPA**: ASP.NET Core serves static frontend assets from `wwwroot` in production.
- **Browser draft persistence**: unsaved compose text is kept in `sessionStorage`.

## Development Notes

- The frontend centers around `client\src\App.tsx`, `useUserId`, and `useNotes`.
- The backend entry point is `src\NoteApp.Api\Program.cs`.
- `src\NoteApp.Api\Services\NoteStorageService.cs` contains the core JSON persistence logic.
- CORS is restricted to configured SPA origins, with `http://localhost:5173` as the default development origin.
- API rate limiting is enabled in the ASP.NET Core pipeline.

## Further Reading

- Product requirements: [`prd.md`](./prd.md)
- Backend security/code review notes: [`docs/code-review/2026-05-16-noteapp-api-security-review.md`](./docs/code-review/2026-05-16-noteapp-api-security-review.md)

## License

This project is licensed under the [MIT License](./LICENSE).
