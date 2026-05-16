import styles from './ThemeSwitcher.module.css'
import type { ThemeId } from '../hooks/useTheme'

interface ThemeSwitcherProps {
  theme: ThemeId
  onThemeChange: (theme: ThemeId) => void
}

const THEME_OPTIONS: Array<{ id: ThemeId; label: string }> = [
  { id: 'github', label: 'GitHub' },
  { id: 'microsoft', label: 'Microsoft' },
  { id: 'apple', label: 'Apple' },
]

/**
 * Presents the three requested UI directions so they can be reviewed from one running app.
 */
export function ThemeSwitcher({ theme, onThemeChange }: ThemeSwitcherProps) {
  return (
    <nav className={styles.switcher} aria-label="UI style variants">
      {THEME_OPTIONS.map((option) => {
        const isActive = option.id === theme

        return (
          <button
            key={option.id}
            type="button"
            className={styles.button}
            aria-pressed={isActive}
            data-active={isActive}
            onClick={() => onThemeChange(option.id)}
          >
            {option.label}
          </button>
        )
      })}
    </nav>
  )
}
