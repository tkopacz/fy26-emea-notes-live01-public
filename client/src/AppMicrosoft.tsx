import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import type { Note } from './api/notesApi'
import { ComposeArea } from './components/ComposeArea'
import type { ComposeAreaHandle } from './components/ComposeArea'
import { ErrorBanner } from './components/ErrorBanner'
import { NoteCard } from './components/NoteCard'
import { useNotes } from './hooks/useNotes'
import { useUserId } from './hooks/useUserId'
import styles from './AppMicrosoft.module.css'
import './themes/microsoft/tokens.css'

type PivotId = 'notes' | 'compose'

/**
 * Small inline SVG icon set so the Fluent-inspired layout can use crisp 24px actions
 * without adding a new runtime dependency.
 */
function FluentIcon({
  children,
  filled = false,
}: {
  children: ReactNode
  filled?: boolean
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={styles.icon}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

/**
 * Root application component for the Microsoft Fluent-inspired review variant.
 * Existing note creation, cloning, and loading behavior remain unchanged.
 */
function AppMicrosoft() {
  const { userId, truncatedId, isStorageUnavailable } = useUserId()
  const { notes, loading, error, saveNote } = useNotes(userId)
  const composeRef = useRef<ComposeAreaHandle>(null)
  const pendingCloneIdRef = useRef<string | undefined>(undefined)
  const [activePivot, setActivePivot] = useState<PivotId>('notes')
  const [copied, setCopied] = useState(false)

  const handleClone = (note: Note) => {
    pendingCloneIdRef.current = note.id
    setActivePivot('compose')
    composeRef.current?.focusAndScroll(note.content)
  }

  const handleSave = async (content: string) => {
    const clonedFromId = pendingCloneIdRef.current
    pendingCloneIdRef.current = undefined
    await saveNote(content, clonedFromId)
    setActivePivot('notes')
  }

  const handleCreateClick = () => {
    setActivePivot('compose')
    composeRef.current?.focusAndScroll()
  }

  const handleCopyId = async () => {
    if (!userId || !navigator.clipboard?.writeText) {
      return
    }

    await navigator.clipboard.writeText(userId)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const noteCountLabel = notes.length === 1 ? '1 note' : `${notes.length} notes`
  const authorMetadata = truncatedId ? `You · ${truncatedId}…` : 'You'

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <ol className={styles.breadcrumbList}>
            <li>Home</li>
            <li aria-hidden="true">/</li>
            <li>Notes</li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Microsoft variant</li>
          </ol>
        </nav>

        <header className={styles.commandBar}>
          <div className={styles.commandContext}>
            <div className={styles.commandTitleRow}>
              <span className={styles.commandIcon}>
                <FluentIcon>
                  <path d="M7 3.75h7.25L18.25 7.75V20.25H7z" />
                  <path d="M14.25 3.75V7.75H18.25" />
                </FluentIcon>
              </span>
              <div>
                <p className={styles.eyebrow}>Command bar</p>
                <h1 className={styles.title}>Immutable Notes</h1>
                <p className={styles.subtitle}>
                  Capture updates in a Fluent-inspired workspace with permanent, read-only notes.
                </p>
              </div>
            </div>
            <div className={styles.identityCard}>
              <span className={styles.identityLabel}>Current author</span>
              <code className={styles.identityValue}>
                {truncatedId ? `${truncatedId}…` : 'Loading…'}
              </code>
            </div>
          </div>

          <div className={styles.commandActions}>
            <button
              type="button"
              className={styles.commandButton}
              onClick={handleCreateClick}
            >
              <FluentIcon filled>
                <path d="M12 5.25a.75.75 0 0 1 .75.75v5.25H18a.75.75 0 0 1 0 1.5h-5.25V18a.75.75 0 0 1-1.5 0v-5.25H6a.75.75 0 0 1 0-1.5h5.25V6a.75.75 0 0 1 .75-.75Z" />
              </FluentIcon>
              New note
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleCopyId}
              disabled={!userId}
            >
              <FluentIcon>
                <rect x="8" y="8" width="9" height="11" rx="1.25" />
                <path d="M6.75 15.25H6A1.25 1.25 0 0 1 4.75 14V5.5C4.75 4.81 5.31 4.25 6 4.25h6.5c.69 0 1.25.56 1.25 1.25V6.5" />
              </FluentIcon>
              {copied ? 'Copied' : 'Copy ID'}
            </button>
          </div>
        </header>

        <nav className={styles.pivots} aria-label="Primary views">
          <button
            type="button"
            className={styles.pivot}
            data-active={activePivot === 'notes'}
            onClick={() => setActivePivot('notes')}
          >
            All notes
          </button>
          <button
            type="button"
            className={styles.pivot}
            data-active={activePivot === 'compose'}
            onClick={handleCreateClick}
          >
            Compose
          </button>
        </nav>

        <div className={styles.feedbackStack}>
          {isStorageUnavailable && (
            <ErrorBanner message="Your browser local storage is unavailable. Your ID is in-memory only." />
          )}
          {error && <ErrorBanner message={error} />}
        </div>

        <main className={styles.main}>
          <section className={styles.listPanel} aria-labelledby="notes-heading">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelEyebrow}>Documents</p>
                <h2 id="notes-heading" className={styles.panelTitle}>Recent notes</h2>
              </div>
              <span className={styles.countBadge}>{noteCountLabel}</span>
            </div>

            {loading && notes.length === 0 && (
              <p className={styles.loading} aria-live="polite">Loading notes…</p>
            )}

            {!loading && notes.length === 0 && !error && userId && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>
                  <FluentIcon>
                    <path d="M7 3.75h7.25L18.25 7.75V20.25H7z" />
                    <path d="M14.25 3.75V7.75H18.25" />
                  </FluentIcon>
                </span>
                <h3 className={styles.emptyTitle}>No notes yet</h3>
                <p className={styles.emptyBody}>
                  Start a new draft from the compose panel to create your first immutable note.
                </p>
              </div>
            )}

            <section className={styles.noteList} aria-label="Your notes">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onClone={handleClone}
                  authorLabel={authorMetadata}
                />
              ))}
            </section>
          </section>

          <aside className={styles.detailPanel}>
            <ComposeArea ref={composeRef} onSave={handleSave} saving={loading} />
          </aside>
        </main>
      </div>
    </div>
  )
}

export default AppMicrosoft
