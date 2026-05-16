import type { ReactNode } from 'react'
import { useState } from 'react'
import type { Note } from '../api/notesApi'
import styles from './NoteCard.module.css'

/** Maximum characters shown before the "Show more" truncation kicks in (GH-010). */
const TRUNCATE_AT = 10_000

interface NoteCardProps {
  note: Note
  onClone: (note: Note) => void
  authorLabel?: string
}

/**
 * Inline icon helper keeps the card visuals close to Fluent's 24px system icons
 * without pulling in a new package just for this review branch.
 */
function CardIcon({
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
 * Displays a single immutable note.
 *
 * Features:
 * - Shows formatted local date (DD MMM YYYY) and time (HH:mm:ss) — GH-009.
 * - Content longer than 10,000 characters is truncated with Show more/less — GH-010.
 * - Locked icon reinforces read-only status — GH-004.
 * - Clone button pre-fills the compose area with this note's content — GH-005.
 */
export function NoteCard({ note, onClone, authorLabel = 'You' }: NoteCardProps) {
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
      <div className={styles.header}>
        <div className={styles.headingGroup}>
          <span className={styles.iconBadge}>
            <CardIcon>
              <path d="M7 3.75h7.25L18.25 7.75V20.25H7z" />
              <path d="M14.25 3.75V7.75H18.25" />
            </CardIcon>
          </span>
          <div className={styles.headerText}>
            <h3 className={styles.title}>Immutable note</h3>
            <div className={styles.metadataRow}>
              <span className={styles.metadataItem}>Author: {authorLabel}</span>
              <span className={styles.metadataDivider} aria-hidden="true">•</span>
              <time dateTime={note.createdAt} className={styles.metadataItem}>
                {formattedDate} · {formattedTime}
              </time>
            </div>
          </div>
        </div>
        <div className={styles.controls}>
          <span className={styles.lockBadge} title="This note is permanently read-only" aria-label="Read-only">
            <CardIcon filled>
              <path d="M12 2.75a4 4 0 0 0-4 4V9H7.5A1.75 1.75 0 0 0 5.75 10.75v7.5C5.75 19.22 6.53 20 7.5 20h9c.97 0 1.75-.78 1.75-1.75v-7.5C18.25 9.78 17.47 9 16.5 9H16V6.75a4 4 0 0 0-4-4Zm-2.5 6.25v-2.25a2.5 2.5 0 0 1 5 0V9h-5Z" />
            </CardIcon>
          </span>
          <button
            type="button"
            className={styles.cloneBtn}
            onClick={() => onClone(note)}
            title="Clone this note into the compose area"
            aria-label="Clone note"
          >
            <CardIcon>
              <rect x="8" y="8" width="9" height="11" rx="1.25" />
              <path d="M6.75 15.25H6A1.25 1.25 0 0 1 4.75 14V5.5C4.75 4.81 5.31 4.25 6 4.25h6.5c.69 0 1.25.56 1.25 1.25V6.5" />
            </CardIcon>
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
    </article>
  )
}
