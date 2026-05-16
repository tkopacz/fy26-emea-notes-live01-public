# PRD: Immutable Note-Taking App

## 1. Product overview

### 1.1 Document title and version

- PRD: Immutable Note-Taking App
- Version: 1.0

### 1.2 Product summary

The Immutable Note-Taking App is a web-based application that allows users to capture timestamped notes that become permanently read-only once saved. Each note records the exact date, time, and content at the moment of creation, providing an append-only audit trail of thoughts or records.

Users are identified by a GUID stored in the browser (no login required). Each user has an isolated view of their own notes. A "clone" feature lets users create a new editable note pre-populated with the content of any existing note, preserving the immutable history while enabling iteration.

The backend is built with ASP.NET Core (C#) and exposes a REST API. Notes are persisted in a JSON file per user stored in a dedicated `data/` subfolder on the server. The frontend is a React 18 SPA that communicates with the API and manages the user GUID in browser local storage.

---

## 2. Goals

### 2.1 Business goals

- Provide a lightweight, zero-friction note capture tool requiring no account registration.
- Maintain a tamper-evident, append-only record of all notes per user.
- Keep infrastructure costs minimal by using flat-file JSON storage instead of a database.

### 2.2 User goals

- Quickly capture a note without logging in or filling out a form.
- Trust that previously saved notes will never be modified or lost.
- Start a new note from an existing one without retyping common content.
- Access only their own notes across sessions via a persistent browser identity.

### 2.3 Non-goals

- User authentication, passwords, or OAuth integration.
- Sharing notes between users.
- Deleting or archiving notes.
- Full-text search across notes (v1).
- Rich-text / markdown rendering of note content (v1).
- Mobile-native apps (iOS / Android).

---

## 3. User personas

### 3.1 Key user types

- **Solo note-taker**: A single person capturing personal records, meeting notes, or daily logs.
- **Returning user**: Someone who revisits their note history and clones a previous note as a template.

### 3.2 Basic persona details

- **First-time visitor**: Opens the app for the first time; a GUID is automatically generated and stored in their browser. They immediately see an empty note list and a compose area.
- **Returning visitor**: Returns with the GUID still in local storage; their full note history loads automatically.

### 3.3 Role-based access

- **User (GUID holder)**: Can create notes, view their own notes, and clone any of their notes. Cannot edit or delete existing notes.
- **Server file system**: Notes are stored in `data/{guid}.json`; no cross-user access is possible via the API.

---

## 4. Functional requirements

- **GUID-based identity** (Priority: High)
  - On first visit the SPA generates a UUID v4 and stores it in `localStorage` under the key `noteapp_user_id`.
  - All API requests include the GUID in the `X-User-Id` request header.
  - The server scopes all reads and writes to `data/{guid}.json`.

- **Create note** (Priority: High)
  - User types content into a text area and clicks "Save".
  - The server records `createdAt` (UTC ISO-8601 timestamp) and the content.
  - The note is immediately appended to the user's JSON file and returned to the SPA.
  - After saving, the note is rendered as read-only; the compose area is cleared.

- **View notes** (Priority: High)
  - The SPA fetches all notes for the current user on load and after each save.
  - Notes are displayed in reverse-chronological order (newest first).
  - Each note card shows: formatted date, formatted time (local timezone), and content.
  - All note cards are visually read-only (no edit controls).

- **Clone note** (Priority: High)
  - Each note card has a "Clone" button.
  - Clicking Clone pre-fills the compose area with the selected note's content.
  - The user may edit the pre-filled content and save it as a new note.
  - The clone relationship is recorded in the new note (`clonedFromId` field) for traceability.

- **Persistent JSON storage** (Priority: High)
  - The server stores notes in `data/{guid}.json` relative to the application root.
  - The `data/` directory is created automatically if it does not exist.
  - Each file contains a JSON array of note objects; new notes are appended.
  - File writes are atomic (write to a temp file, then rename) to prevent corruption.

- **API** (Priority: High)
  - `GET /api/notes` — returns all notes for the requesting user (identified by `X-User-Id` header).
  - `POST /api/notes` — creates a new note; body: `{ content: string, clonedFromId?: string }`.
  - Both endpoints return `400 Bad Request` if the `X-User-Id` header is missing or not a valid GUID.

- **Display user identity** (Priority: Medium)
  - The SPA shows a truncated GUID (first 8 characters) in the header so users can confirm their identity.
  - A "Copy full ID" tooltip/button allows users to copy the full GUID (e.g., to use on another device).

---

## 5. User experience

### 5.1 Entry points & first-time user flow

- User navigates to the app URL.
- App detects no GUID in `localStorage`, generates one, and stores it.
- Empty note list is displayed with a prominent compose area and a brief explainer: "Your notes are saved permanently and cannot be edited."
- No modal, login screen, or onboarding wizard.

### 5.2 Core experience

- **Compose**: A single text area labeled "New note" occupies the top of the page. A "Save" button is disabled while the text area is empty.
- **Save**: On click, the note is sent to the API. A brief loading indicator appears. On success, the new note appears at the top of the list and the text area clears.
- **View**: The note list below the compose area shows all notes as cards. Each card displays the date and time prominently and the content below. Cards have no edit controls.
- **Clone**: Each card has a "Clone" button (icon + label). Clicking it scrolls the page to the compose area and pre-fills it with the note's content.

### 5.3 Advanced features & edge cases

- If `localStorage` is unavailable (private browsing with strict settings), display a warning banner and generate an in-memory GUID (notes will not persist across tabs/sessions in this case).
- If the JSON file on disk is corrupted, the API returns `500` with a descriptive error; the SPA displays a non-dismissable error banner.
- Concurrent writes from the same user (multiple tabs) are handled by server-side file locking (or retry-on-conflict logic).
- Very long notes (>10,000 characters) are accepted but truncated in the card view with a "Show more" toggle.
- The compose area remembers unsaved content in `sessionStorage` so a page refresh does not lose a draft.

### 5.4 UI/UX highlights

- Clean, minimal single-column layout; no sidebar.
- Read-only note cards have a subtle locked icon to reinforce immutability.
- Local timezone formatting for date/time display (UTC stored server-side).
- Responsive design: usable on desktop and tablet viewports.
- "Clone" pre-fill scrolls the viewport to the compose area and focuses it.

---

## 6. Narrative

Anna opens the app on her work laptop to jot down a decision made in a meeting. Without any sign-up, the app is ready: she types her note and clicks Save. The note is locked immediately — she knows no one (including herself) can alter it later. A week later, she returns and sees her full note history. She finds a recurring meeting note and clicks Clone, which pre-fills her new note with the old content. She adjusts a few lines and saves the new version, building an immutable chain of meeting records she can trust completely.

---

## 7. Success metrics

### 7.1 User-centric metrics

- Time from page load to first saved note < 30 seconds for a new user.
- Zero instances of data loss or note mutation reported.
- Clone feature used in ≥ 20% of note creation events.

### 7.2 Business metrics

- Storage footprint per 1,000 notes < 5 MB (JSON overhead is minimal).
- No database infrastructure cost (flat-file storage).

### 7.3 Technical metrics

- API response time for `GET /api/notes` (up to 500 notes) < 200 ms.
- API response time for `POST /api/notes` < 150 ms.
- Frontend bundle size (gzipped) < 200 KB.
- Zero cross-user data leakage incidents.

---

## 8. Technical considerations

### 8.1 Integration points

- **ASP.NET Core 8 Web API**: serves both the REST API and the built React SPA static files in production.
- **React 18 SPA**: bootstrapped with Vite; communicates with the API via `fetch`.
- **File system**: `data/` subfolder relative to the server working directory; writable by the process user.

### 8.2 Data storage & privacy

- Each user's notes are stored in `data/{guid}.json` — the GUID is the only identifier; no PII is collected.
- The `data/` folder must not be served as static content (configure ASP.NET Core to exclude it).
- File contents should not be logged; GUID values in logs should be truncated to the first 8 characters.
- Consider encrypting the `data/` folder at rest at the OS/infrastructure level (out of scope for v1 app code).

### 8.3 Scalability & performance

- Flat-file JSON is suitable for single-instance deployments with moderate note volumes (< 10,000 notes per user).
- For horizontal scaling, a shared network volume or migration to a database (SQLite or Cosmos DB) would be required — out of scope for v1.
- File reads load the entire user file into memory; acceptable for v1 note volumes.

### 8.4 Potential challenges

- **Concurrent writes**: Multiple browser tabs for the same user can cause race conditions. Mitigate with a per-file `SemaphoreSlim` lock in the API.
- **GUID collision**: UUID v4 collision probability is negligible (~10⁻³⁷) but the API should return `409 Conflict` if a GUID file already exists during first write (effectively impossible but defensively handled).
- **Data migration**: If storage format changes in v2, a migration script must process all `data/*.json` files.
- **Lost GUID**: If a user clears local storage, their notes become inaccessible (no recovery mechanism in v1). The "Copy full ID" feature mitigates accidental loss.

---

## 9. Milestones & sequencing

### 9.1 Project estimate

- **Small–Medium**: 2–3 weeks for a solo developer.

### 9.2 Team size & composition

- **1–2 developers**: 1 full-stack developer (C# + React); optionally 1 UX/QA.

### 9.3 Suggested phases

- **Phase 1 — Backend API** (3–4 days)
  - ASP.NET Core project scaffold.
  - `GET /api/notes` and `POST /api/notes` endpoints.
  - JSON file storage with atomic writes and per-file locking.
  - Unit tests for storage layer and API controllers.

- **Phase 2 — React SPA** (4–5 days)
  - Vite + React 18 project scaffold.
  - GUID generation and `localStorage` persistence.
  - Compose area with draft persistence in `sessionStorage`.
  - Note list with date/time formatting and read-only cards.
  - Clone button with scroll-to-compose behavior.

- **Phase 3 — Integration & polish** (2–3 days)
  - Serve SPA from ASP.NET Core in production mode.
  - Error handling banners and loading states.
  - Responsive layout and locked-icon styling.
  - End-to-end smoke tests.

---

## 10. User stories

### 10.1. Auto-assign user identity on first visit

- **ID**: GH-001
- **Description**: As a first-time visitor, I want a unique identity assigned automatically so that I can use the app immediately without registering.
- **Acceptance criteria**:
  - A UUID v4 is generated and stored in `localStorage` under `noteapp_user_id` on first page load.
  - If a GUID already exists in `localStorage`, it is reused on subsequent visits.
  - The first 8 characters of the GUID are displayed in the app header.
  - A "Copy full ID" control copies the full GUID to the clipboard.

### 10.2. Create a new note

- **ID**: GH-002
- **Description**: As a user, I want to type content and save it as a note so that my thought is recorded with the current date and time.
- **Acceptance criteria**:
  - A text area is present at the top of the page labeled "New note."
  - The "Save" button is disabled when the text area is empty or contains only whitespace.
  - On save, a `POST /api/notes` request is sent with the content and the `X-User-Id` header.
  - The server appends the note (with `id`, `createdAt` UTC timestamp, `content`) to `data/{guid}.json`.
  - The new note appears at the top of the note list immediately after a successful save.
  - The text area is cleared after a successful save.

### 10.3. View all personal notes

- **ID**: GH-003
- **Description**: As a returning user, I want to see all my previously saved notes so that I can review my history.
- **Acceptance criteria**:
  - On page load, `GET /api/notes` is called with the `X-User-Id` header.
  - All notes belonging to the GUID are returned and rendered.
  - Notes are displayed in reverse-chronological order (newest first).
  - Each note card shows the formatted local date, formatted local time, and full content.
  - No other user's notes are ever returned by the API.

### 10.4. Notes are permanently read-only

- **ID**: GH-004
- **Description**: As a user, I want to be assured that saved notes cannot be modified so that I can trust their integrity.
- **Acceptance criteria**:
  - No edit or delete controls are present on note cards.
  - Each note card displays a locked icon.
  - The `POST /api/notes` endpoint does not accept an `id` field; providing one has no effect.
  - There is no `PUT`, `PATCH`, or `DELETE` endpoint for notes.
  - The JSON file on disk is only ever appended to, never overwritten in-place.

### 10.5. Clone an existing note

- **ID**: GH-005
- **Description**: As a user, I want to clone an existing note so that I can create a new note based on previous content without retyping.
- **Acceptance criteria**:
  - Each note card has a "Clone" button.
  - Clicking Clone pre-fills the compose text area with the source note's content.
  - The viewport scrolls to and focuses the compose area.
  - The user can edit the pre-filled content before saving.
  - Saving the cloned note creates a new note with the new content and a new `createdAt` timestamp.
  - The new note's `clonedFromId` field is set to the source note's `id`.
  - The source note is unchanged.

### 10.6. Persist draft across page refresh

- **ID**: GH-006
- **Description**: As a user, I want an unsaved draft to survive a page refresh so that I do not lose work in progress.
- **Acceptance criteria**:
  - The compose text area content is saved to `sessionStorage` on each keystroke.
  - On page load, if `sessionStorage` contains a draft, it is restored into the compose area.
  - After a successful save, the draft is cleared from `sessionStorage`.

### 10.7. Handle missing or invalid user identity

- **ID**: GH-007
- **Description**: As a developer, I want the API to reject requests with missing or invalid GUIDs so that data integrity is maintained.
- **Acceptance criteria**:
  - `GET /api/notes` and `POST /api/notes` return `400 Bad Request` if `X-User-Id` is missing.
  - Both endpoints return `400 Bad Request` if `X-User-Id` is not a valid GUID format.
  - The SPA displays a non-dismissable error banner if the API returns `400` due to identity issues.

### 10.8. Handle storage errors gracefully

- **ID**: GH-008
- **Description**: As a user, I want to see a clear error message if the server cannot read or write my notes so that I know something went wrong.
- **Acceptance criteria**:
  - If `data/{guid}.json` cannot be read (permissions, corruption), `GET /api/notes` returns `500` with a descriptive message.
  - If a note cannot be written, `POST /api/notes` returns `500`.
  - The SPA displays a visible error banner for any `5xx` response.
  - The error banner does not dismiss automatically; the user must reload the page.

### 10.9. Display note date and time in local timezone

- **ID**: GH-009
- **Description**: As a user, I want note timestamps shown in my local timezone so that dates and times are meaningful to me.
- **Acceptance criteria**:
  - The server stores `createdAt` as a UTC ISO-8601 string.
  - The SPA converts `createdAt` to the browser's local timezone for display.
  - Date format: `DD MMM YYYY` (e.g., `16 May 2026`).
  - Time format: `HH:mm:ss` (24-hour, e.g., `14:35:02`).

### 10.10. Show more / show less for long notes

- **ID**: GH-010
- **Description**: As a user, I want long notes to be truncated in the list view with an option to expand so that the page remains readable.
- **Acceptance criteria**:
  - Note content longer than 10,000 characters is truncated at that boundary in the card view.
  - A "Show more" link appears below truncated content.
  - Clicking "Show more" expands the card to reveal the full content.
  - A "Show less" link collapses the card back to the truncated view.
