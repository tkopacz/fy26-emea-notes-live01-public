# Immutable Note-Taking App - Phase 1 API Scaffold

This repository now contains the first backend building block for the note-taking app: an ASP.NET Core 8 Web API named `NotesApi`.

## What is included

- ASP.NET Core 8 Web API project in `/home/runner/work/fy26-emea-notes-live01-public/fy26-emea-notes-live01-public/NotesApi`
- Swagger/OpenAPI enabled in **Development**
- CORS configured for the React SPA development server at `http://localhost:5173`
- Health endpoint at `GET /health`
- `data/` ignored by Git so runtime note storage does not get committed
- Simple helper scripts for starting the API and checking the health endpoint

## Project structure

```text
fy26-emea-notes-live01-public/
├── .gitignore
├── README.md
├── LICENSE
├── scripts/
│   ├── smoke-test.sh
│   └── start-api.sh
└── NotesApi/
    ├── NotesApi.csproj
    ├── NotesApi.http
    ├── Program.cs
    ├── appsettings.json
    ├── appsettings.Development.json
    └── Properties/
        └── launchSettings.json
```

## Prerequisites

Before you run the API, make sure you have:

1. **.NET 8 SDK** installed
2. A terminal
3. Optionally, an editor such as VS Code or Visual Studio

You can confirm the SDK by running:

```bash
dotnet --list-sdks
```

Look for an entry that starts with `8.`.

## Quick start

### Option 1: use the helper script

From the repository root:

```bash
./scripts/start-api.sh
```

What this does:

- changes into the repository root
- starts `NotesApi`
- uses the `http` launch profile from `launchSettings.json`
- runs in `Development`, so Swagger is enabled

### Option 2: run dotnet manually

From the repository root:

```bash
dotnet run --project /home/runner/work/fy26-emea-notes-live01-public/fy26-emea-notes-live01-public/NotesApi/NotesApi.csproj --launch-profile http
```

## Default local URLs

The API launch settings currently use:

- `http://localhost:5041`

That means the most important local endpoints are:

- Swagger UI: `http://localhost:5041/swagger`
- Health check: `http://localhost:5041/health`

## How to verify the API is working

### Browser check

Open:

```text
http://localhost:5041/swagger
```

You should see the Swagger UI page.

### Terminal check

Run:

```bash
curl -i http://localhost:5041/health
```

Expected result:

- HTTP status `200 OK`

### Helper smoke test

You can also run:

```bash
./scripts/smoke-test.sh
```

This sends a request to `/health` and prints the response headers and body.

## CORS configuration

The backend allows requests from the React SPA development server:

```text
http://localhost:5173
```

This is configured in `Program.cs` as the initial development origin for frontend work.

## Notes for junior developers

### Why Swagger is only enabled in Development

Swagger is very useful during local development because it lets you:

- inspect endpoints
- test requests quickly
- confirm the API contract

It is currently turned on only in `Development` to follow a common safe default.

### Why `/health` exists

The health endpoint is a very small endpoint that answers a simple question:

> “Is the API process up and able to accept requests?”

This is helpful for:

- local debugging
- CI checks
- container orchestration or deployment platforms later

### Why `data/` is ignored

The app is expected to store runtime note data in a `data/` folder later in the project.
That folder should not be committed because it contains generated runtime state rather than source code.

## Build the project

From the repository root:

```bash
dotnet build /home/runner/work/fy26-emea-notes-live01-public/fy26-emea-notes-live01-public/NotesApi/NotesApi.csproj
```

## Useful development files

- `NotesApi/Program.cs` - main API setup
- `NotesApi/Properties/launchSettings.json` - local launch URLs and development profile
- `NotesApi/NotesApi.http` - example HTTP requests you can run from supported editors
- `scripts/start-api.sh` - starts the API
- `scripts/smoke-test.sh` - checks the health endpoint

## Next likely backend steps

After this scaffold, common next tasks would be:

1. add note models
2. add JSON file persistence in `data/`
3. add API endpoints for creating and reading notes
4. add automated tests

For Phase 1, this repository now focuses only on the clean API foundation.
