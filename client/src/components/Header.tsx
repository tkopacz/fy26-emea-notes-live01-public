import { useState } from 'react'
import { ThemeSwitcher } from './ThemeSwitcher'
import styles from './Header.module.css'
import type { ThemeId } from '../hooks/useTheme'

interface HeaderProps {
  truncatedId: string
  fullId: string
  theme: ThemeId
  onThemeChange: (theme: ThemeId) => void
}

/**
 * App header: displays the truncated user GUID and a "Copy full ID" button.
 * The copy button lets users transfer their identity to another device
 * (mitigates lost-GUID risk from clearing localStorage).
 */
export function Header({ truncatedId, fullId, theme, onThemeChange }: HeaderProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullId)
    setCopied(true)
    // Reset the "Copied!" label after 2 seconds.
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>📝 Immutable Notes</h1>
      <div className={styles.meta}>
        {/* The switcher lets the owner compare all requested design directions from one running build. */}
        <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
        {truncatedId && (
          <div className={styles.identity}>
            <span className={styles.idLabel} title={fullId}>
              ID: <code>{truncatedId}…</code>
            </span>
            <button
              className={styles.copyBtn}
              onClick={handleCopy}
              title="Copy your full user ID to clipboard"
              aria-label="Copy full user ID"
            >
              {copied ? '✓ Copied!' : 'Copy full ID'}
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
