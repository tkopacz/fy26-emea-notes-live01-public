import { useMemo, useRef } from 'react'
import type { Note } from './api/notesApi'
import styles from './AppApple.module.css'
import { ComposeArea } from './components/ComposeArea'
import type { ComposeAreaHandle } from './components/ComposeArea'
import { ErrorBanner } from './components/ErrorBanner'
import { Header } from './components/Header'
import { NoteCard } from './components/NoteCard'
import { useNotes } from './hooks/useNotes'
import { useUserId } from './hooks/useUserId'

/**
 * Apple HIG-inspired Notes shell with folders, list, and editor panes.
 * The existing hooks and note actions stay intact so the UI refresh is low-risk.
 */
function AppApple() {
  const { userId, truncatedId, isStorageUnavailable } = useUserId()
  const { notes, loading, error, saveNote } = useNotes(userId)

  // The editor stays imperative so list actions can clone into the compose pane.
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

  // Lightweight derived metadata keeps the faux folder sidebar feeling alive.
  const { folderGroups, noteCountLabel, latestSavedLabel } = useMemo(() => {
    const today = new Date()
    const todayCount = notes.filter((note) => {
      const createdAt = new Date(note.createdAt)
      return createdAt.toDateString() === today.toDateString()
    }).length

    const latestNote = notes[0]
    const latestSavedLabel = latestNote
      ? new Date(latestNote.createdAt).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'No synced notes yet'

    return {
      folderGroups: [
        {
          title: 'iCloud',
          items: [
            { icon: '🗂️', label: 'All Notes', count: notes.length, isActive: true },
            { icon: '📆', label: 'Today', count: todayCount },
          ],
        },
        {
          title: 'Collections',
          items: [
            { icon: '📌', label: 'Pinned', count: 0 },
            { icon: '🧾', label: 'Drafts', count: 1 },
          ],
        },
      ],
      noteCountLabel: notes.length === 1 ? '1 note' : `${notes.length} notes`,
      latestSavedLabel,
    }
  }, [notes])

  return (
    <div className={styles.app}>
      <div className={styles.shell}>
        <Header truncatedId={truncatedId} fullId={userId} />
        {isStorageUnavailable && (
          <ErrorBanner message="Your browser local storage is unavailable. Your ID is in-memory only." />
        )}
        {error && <ErrorBanner message={error} />}

        <main className={styles.workspace}>
          <aside className={styles.sidebar} aria-label="Folders navigation">
            <div className={styles.sidebarHeader}>
              <p className={styles.eyebrow}>Library</p>
              <h2 className={styles.paneTitle}>Folders</h2>
            </div>

            {folderGroups.map((group) => (
              <section key={group.title} className={styles.folderGroup} aria-label={group.title}>
                <p className={styles.groupTitle}>{group.title}</p>
                <ul className={styles.folderList}>
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <button
                        type="button"
                        className={item.isActive ? styles.folderItemActive : styles.folderItem}
                      >
                        <span className={styles.folderLabel}>
                          <span aria-hidden="true">{item.icon}</span>
                          {item.label}
                        </span>
                        <span className={styles.folderCount}>{item.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </aside>

          <section className={styles.listPane} aria-label="Notes list">
            <div className={styles.paneHeader}>
              <div>
                <p className={styles.eyebrow}>Browse</p>
                <h2 className={styles.paneTitle}>All Notes</h2>
              </div>
              <div className={styles.paneMeta}>
                <span>{noteCountLabel}</span>
                <span>Swipe actions</span>
              </div>
            </div>

            {loading && notes.length === 0 && (
              <p className={styles.loading} aria-live="polite">
                Loading notes…
              </p>
            )}

            {!loading && notes.length === 0 && !error && userId && (
              <section className={styles.emptyState} aria-label="Empty notes state">
                <span className={styles.emptyIcon} aria-hidden="true">
                  📝
                </span>
                <h3>No notes yet</h3>
                <p>Start typing in the editor to create your first iCloud-style note.</p>
              </section>
            )}

            <div className={styles.noteList}>
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} onClone={handleClone} />
              ))}
            </div>
          </section>

          <section className={styles.editorPane} aria-label="Editor panel">
            <div className={styles.paneHeader}>
              <div>
                <p className={styles.eyebrow}>Compose</p>
                <h2 className={styles.paneTitle}>Inline Editor</h2>
              </div>
              <div className={styles.paneMeta}>
                <span>Latest sync</span>
                <span>{latestSavedLabel}</span>
              </div>
            </div>

            <ComposeArea ref={composeRef} onSave={handleSave} saving={loading} />
          </section>
        </main>
      </div>
    </div>
  )
}

export default AppApple
