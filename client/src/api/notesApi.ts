/**
 * Typed API client for the Notes backend.
 * All requests include the X-User-Id header set to the caller's GUID.
 */

export interface Note {
  id: string
  createdAt: string  // UTC ISO-8601 string from server
  content: string
  clonedFromId?: string | null
}

export interface CreateNotePayload {
  content: string
  clonedFromId?: string
}

const API_BASE = '/api/notes'

/**
 * Fetches all notes for the given user, returned newest-first by the server.
 * @throws Error on non-2xx response or network failure.
 */
export async function getNotes(userId: string): Promise<Note[]> {
  const response = await fetch(API_BASE, {
    headers: { 'X-User-Id': userId },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? `GET /api/notes failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Creates a new note on the server.
 * @throws Error on non-2xx response or network failure.
 */
export async function createNote(userId: string, payload: CreateNotePayload): Promise<Note> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? `POST /api/notes failed: ${response.status}`)
  }

  return response.json()
}
