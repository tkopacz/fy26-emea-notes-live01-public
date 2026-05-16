import { useState } from 'react'
import type { Note } from '../api/notesApi'
import styles from './NoteCard.module.css'

/** Maximum characters shown before the "Show more" truncation kicks in (GH-010). */
const TRUNCATE_AT = 10_000

interface NoteCardProps {
  note: Note
  onClone: (note: Note) => void
}

/**
 * Displays a single immutable note.
 *
 * Features:
 * - Shows formatted local date (DD MMM YYYY) and time (HH:mm:ss) — GH-009.
 * - Content longer than 10,000 characters is truncated with Show more/less — GH-010.
 * - Locked icon reinforces read-only status — GH-004.
 * - Clone button pre-fills the compose area with this note's content — GH-005.
 */
export function NoteCard({ note, onClone }: NoteCardProps) {
  const [expanded, setExpanded] = useState(false)

  // Parse the UTC timestamp and format in the browser's local timezone.
  const date = new Date(note.createdAt)
  const formattedDate = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const isTruncated = note.content.length > TRUNCATE_AT
  const displayContent =
    isTruncated && !expanded ? note.content.slice(0, TRUNCATE_AT) : note.content

  return (
    <article className={styles.card} aria-label={`Note from ${formattedDate}`}>
      <div className={styles.row}>
        <span className={styles.statusDot} aria-hidden="true" />
        <div className={styles.body}>
          <div className={styles.header}>
            <div className={styles.summary}>
              <h3 className={styles.title}>Saved note</h3>
              <div className={styles.timestamp}>
                <time dateTime={note.createdAt} className={styles.date}>
                  {formattedDate}
                </time>
                <span className={styles.separator}>·</span>
                <time dateTime={note.createdAt} className={styles.time}>
                  {formattedTime}
                </time>
                <span
                  className={styles.readOnly}
                  title="This note is permanently read-only"
                  aria-label="Read-only"
                >
                  <svg viewBox="0 0 16 16" width="12" height="12" focusable="false" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M4.75 6a.75.75 0 0 1 .75.75V8h5V6.75a.75.75 0 0 1 1.5 0V8h.25A1.75 1.75 0 0 1 14 9.75v3.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-3.5A1.75 1.75 0 0 1 3.75 8H4V6.75A.75.75 0 0 1 4.75 6ZM3.75 9.5a.25.25 0 0 0-.25.25v3.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.25.25 0 0 0-.25-.25ZM8 1.5A2.25 2.25 0 0 0 5.75 3.75v1a.75.75 0 0 1-1.5 0v-1a3.75 3.75 0 0 1 7.5 0v1a.75.75 0 0 1-1.5 0v-1A2.25 2.25 0 0 0 8 1.5Z"
                    />
                  </svg>
                  Read-only
                </span>
              </div>
            </div>
            <div className={styles.controls}>
              <button
                type="button"
                className={styles.cloneBtn}
                onClick={() => onClone(note)}
                title="Clone this note into the compose area"
                aria-label="Clone note"
              >
                <svg viewBox="0 0 16 16" width="12" height="12" focusable="false" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M0 6.75C0 5.784.784 5 1.75 5h3.5C6.216 5 7 5.784 7 6.75v7.5A1.75 1.75 0 0 1 5.25 16h-3.5A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h3.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Zm5-4.75C6.75.784 7.534 0 8.5 0H12c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 12 11h-.5a.75.75 0 0 1 0-1.5h.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25H8.5a.25.25 0 0 0-.25.25v.5a.75.75 0 0 1-1.5 0Z"
                  />
                </svg>
                Clone
              </button>
            </div>
          </div>

          <p className={styles.content}>
            {displayContent}
            {isTruncated && !expanded && '…'}
          </p>

          {isTruncated && (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}

          {note.clonedFromId && (
            <p className={styles.cloneBadge}>
              Cloned from <code>{note.clonedFromId.slice(0, 8)}…</code>
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
