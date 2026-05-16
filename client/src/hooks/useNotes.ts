import { useCallback, useEffect, useState } from 'react'
import { createNote, getNotes } from '../api/notesApi'
import type { Note } from '../api/notesApi'

interface UseNotesResult {
  notes: Note[]
  loading: boolean
  error: string | null
  saveNote: (content: string, clonedFromId?: string) => Promise<void>
}

/**
 * Manages the note list for the current user.
 *
 * Fetches notes on mount (once userId is available).
 * Exposes saveNote() which POSTs a new note and refreshes the list.
 * Error state is non-dismissable — the user must reload the page.
 */
export function useNotes(userId: string): UseNotesResult {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Loads notes from the server and updates local state.
   * Sets error state on failure.
   */
  const fetchNotes = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const fetched = await getNotes(userId)
      setNotes(fetched)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Fetch notes whenever the userId becomes available (after GUID is resolved).
  useEffect(() => {
    if (userId) {
      fetchNotes()
    }
  }, [userId, fetchNotes])

  /**
   * Saves a new note and refreshes the note list on success.
   * @throws — callers may catch to show immediate feedback, but error state is also set.
   */
  const saveNote = useCallback(
    async (content: string, clonedFromId?: string) => {
      if (!userId) return

      setLoading(true)
      try {
        await createNote(userId, { content, clonedFromId })
        await fetchNotes()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save note.')
        throw err  // re-throw so ComposeArea can react immediately
      } finally {
        setLoading(false)
      }
    },
    [userId, fetchNotes]
  )

  return { notes, loading, error, saveNote }
}
