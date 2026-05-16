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
      {/* Timestamp and controls row */}
      <div className={styles.header}>
        <div className={styles.timestamp}>
          <time dateTime={note.createdAt} className={styles.date}>
            {formattedDate}
          </time>
          <time dateTime={note.createdAt} className={styles.time}>
            {formattedTime}
          </time>
        </div>
        <div className={styles.controls}>
          <span className={styles.lockIcon} title="This note is permanently read-only" aria-label="Read-only">
            🔒
          </span>
          <button
            className={styles.cloneBtn}
            onClick={() => onClone(note)}
            title="Clone this note into the compose area"
            aria-label="Clone note"
          >
            📋 Clone
          </button>
        </div>
      </div>

      {/* Note content */}
      <p className={styles.content}>
        {displayContent}
        {isTruncated && !expanded && '…'}
      </p>

      {/* Show more / show less toggle (GH-010) */}
      {isTruncated && (
        <button
          className={styles.toggleBtn}
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      {/* Clone origin badge */}
      {note.clonedFromId && (
        <p className={styles.cloneBadge}>
          Cloned from <code>{note.clonedFromId.slice(0, 8)}…</code>
        </p>
      )}
    </article>
  )
}
