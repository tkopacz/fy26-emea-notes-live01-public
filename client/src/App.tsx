import { useRef } from 'react'
import { ComposeArea } from './components/ComposeArea'
import type { ComposeAreaHandle } from './components/ComposeArea'
import { ErrorBanner } from './components/ErrorBanner'
import { Header } from './components/Header'
import { NoteCard } from './components/NoteCard'
import { useNotes } from './hooks/useNotes'
import { useTheme } from './hooks/useTheme'
import { useUserId } from './hooks/useUserId'
import type { Note } from './api/notesApi'
import styles from './App.module.css'

/**
 * Root application component.
 * Wires together identity, notes state, and all UI components.
 */
function App() {
  const { userId, truncatedId, isStorageUnavailable } = useUserId()
  const { theme, setTheme } = useTheme()
  const { notes, loading, error, saveNote } = useNotes(userId)

  // Ref to ComposeArea so Clone buttons can scroll-to and pre-fill it.
  const composeRef = useRef<ComposeAreaHandle>(null)

  // Holds the clonedFromId of the most recently cloned note (consumed on next save).
  const pendingCloneIdRef = useRef<string | undefined>(undefined)

  const handleClone = (note: Note) => {
    pendingCloneIdRef.current = note.id
    composeRef.current?.focusAndScroll(note.content)
  }

  const handleSave = async (content: string) => {
    const clonedFromId = pendingCloneIdRef.current
    pendingCloneIdRef.current = undefined
    await saveNote(content, clonedFromId)
  }

  return (
    <div className={styles.app} data-theme={theme}>
      <Header
        truncatedId={truncatedId}
        fullId={userId}
        theme={theme}
        onThemeChange={setTheme}
      />
      {isStorageUnavailable && (
        <ErrorBanner message="Your browser local storage is unavailable. Your ID is in-memory only." />
      )}
      {error && <ErrorBanner message={error} />}
      <main className={styles.main}>
        <ComposeArea ref={composeRef} onSave={handleSave} saving={loading} />
        {loading && notes.length === 0 && (
          <p className={styles.loading} aria-live="polite">Loading notes...</p>
        )}
        {!loading && notes.length === 0 && !error && userId && (
          <p className={styles.emptyState}>No notes yet. Write your first note above!</p>
        )}
        <section aria-label="Your notes">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onClone={handleClone} />
          ))}
        </section>
      </main>
    </div>
  )
}

export default App
