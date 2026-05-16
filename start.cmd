@echo off
setlocal

REM Run from the repository root so relative paths in package.json resolve correctly.
cd /d "%~dp0"

REM Delegate to the root npm start script, which launches both the API and the client.
call npm start

endlocal