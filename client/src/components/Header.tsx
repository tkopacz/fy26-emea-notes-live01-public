import { useState } from 'react'
import styles from './Header.module.css'

interface HeaderProps {
  truncatedId: string
  fullId: string
}

/**
 * App header: displays the truncated user GUID and a "Copy full ID" button.
 * The copy button lets users transfer their identity to another device
 * (mitigates lost-GUID risk from clearing localStorage).
 */
export function Header({ truncatedId, fullId }: HeaderProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullId)
    setCopied(true)
    // Reset the "Copied!" label after 2 seconds.
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.01.44-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.5 7.5 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
        </span>
        <div>
          <p className={styles.overline}>Primer variant</p>
          <h1 className={styles.title}>Immutable Notes</h1>
        </div>
      </div>
      {truncatedId && (
        <div className={styles.identity}>
          <span className={styles.idLabel} title={fullId}>
            ID: <code>{truncatedId}…</code>
          </span>
          <button
            type="button"
            className={styles.copyBtn}
            onClick={handleCopy}
            title="Copy your full user ID to clipboard"
            aria-label="Copy full user ID"
          >
            {copied ? '✓ Copied!' : 'Copy full ID'}
          </button>
        </div>
      )}
    </header>
  )
}
