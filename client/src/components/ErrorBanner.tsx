import styles from './ErrorBanner.module.css'

interface ErrorBannerProps {
  message: string
}

/**
 * Non-dismissable error banner shown for 4xx identity errors and 5xx server errors.
 * The user must reload the page to recover (per GH-007, GH-008 acceptance criteria).
 */
export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className={styles.banner} role="alert" aria-live="assertive">
      <span>⚠️ {message}</span>
      <span className={styles.hint}>Please reload the page to try again.</span>
    </div>
  )
}
