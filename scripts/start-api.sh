#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="/home/runner/work/fy26-emea-notes-live01-public/fy26-emea-notes-live01-public"
PROJECT_PATH="$REPO_ROOT/NotesApi/NotesApi.csproj"

echo "Starting NotesApi on the configured HTTP development profile..."
echo "Swagger: http://localhost:5041/swagger"
echo "Health:  http://localhost:5041/health"

cd "$REPO_ROOT"
dotnet run --project "$PROJECT_PATH" --launch-profile http
