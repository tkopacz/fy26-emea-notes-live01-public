import { useRef } from 'react'
import { ComposeArea } from './components/ComposeArea'
import type { ComposeAreaHandle } from './components/ComposeArea'
import { ErrorBanner } from './components/ErrorBanner'
import { Header } from './components/Header'
import { NoteCard } from './components/NoteCard'
import { useNotes } from './hooks/useNotes'
import { useUserId } from './hooks/useUserId'
import type { Note } from './api/notesApi'
import styles from './App.module.css'

/**
 * Primer-inspired application shell for the immutable notes experience.
 * The data flow stays identical to the original app while the layout adopts
 * a GitHub-style header, sidebar, and issue-list presentation.
 */
export function AppGitHub() {
  const { userId, truncatedId, isStorageUnavailable } = useUserId()
  const { notes, loading, error, saveNote } = useNotes(userId)

  // Keep the existing clone-to-compose flow intact across the new layout.
  const composeRef = useRef<ComposeAreaHandle>(null)
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

  const handleJumpToCompose = () => {
    composeRef.current?.focusAndScroll()
  }

  const noteCountLabel = `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`

  return (
    <div className={styles.app}>
      <Header truncatedId={truncatedId} fullId={userId} />
      {isStorageUnavailable && (
        <ErrorBanner message="Your browser local storage is unavailable. Your ID is in-memory only." />
      )}
      {error && <ErrorBanner message={error} />}
      <main className={styles.main}>
        <aside className={styles.sidebar} aria-label="Notes navigation">
          <div className={styles.sidebarSection}>
            <p className={styles.sidebarEyebrow}>Workspace</p>
            <h2 className={styles.sidebarTitle}>Notes</h2>
            <p className={styles.sidebarText}>
              Compact, immutable notes presented with a GitHub Primer-inspired layout.
            </p>
          </div>
          <nav className={styles.nav} aria-label="Primary">
            <button type="button" className={`${styles.navItem} ${styles.navItemActive}`}>
              <span>All notes</span>
              <span className={styles.navCount}>{notes.length}</span>
            </button>
            <button type="button" className={styles.navItem} onClick={handleJumpToCompose}>
              <span>Compose</span>
            </button>
          </nav>
          {truncatedId && (
            <div className={styles.sidebarMeta}>
              <span className={styles.sidebarMetaLabel}>Viewer</span>
              <code>{truncatedId}…</code>
            </div>
          )}
        </aside>

        <section className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <p className={styles.pageEyebrow}>Immutable Notes</p>
              <h1 className={styles.pageTitle}>Personal note feed</h1>
            </div>
            <p className={styles.pageDescription}>
              Draft a note in the comment box, then review your saved entries below.
            </p>
          </div>

          <ComposeArea ref={composeRef} onSave={handleSave} saving={loading} />

          <section className={styles.noteListSection} aria-label="Your notes">
            <div className={styles.noteListHeader}>
              <h2 className={styles.noteListTitle}>Recent notes</h2>
              <span className={styles.noteCount}>{noteCountLabel}</span>
            </div>

            {loading && notes.length === 0 && (
              <p className={styles.loading} aria-live="polite">Loading notes...</p>
            )}
            {!loading && notes.length === 0 && !error && userId && (
              <p className={styles.emptyState}>No notes yet. Write your first note above!</p>
            )}
            {notes.length > 0 && (
              <div className={styles.noteList}>
                {notes.map((note) => (
                  <NoteCard key={note.id} note={note} onClone={handleClone} />
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  )
}

export default AppGitHub
