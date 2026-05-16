import { useEffect, useState } from 'react'

export type ThemeId = 'github' | 'microsoft' | 'apple'

const DEFAULT_THEME: ThemeId = 'github'
const THEME_QUERY_KEY = 'theme'
const THEME_STORAGE_KEY = 'noteapp_theme'

/**
 * Validates arbitrary values before they are trusted as one of the supported UI variants.
 */
function isThemeId(value: string | null): value is ThemeId {
  return value === 'github' || value === 'microsoft' || value === 'apple'
}

/**
 * Reads the initial theme from the shareable URL first, then from localStorage.
 */
function getInitialTheme(): ThemeId {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME
  }

  const params = new URLSearchParams(window.location.search)
  const themeFromUrl = params.get(THEME_QUERY_KEY)
  if (isThemeId(themeFromUrl)) {
    return themeFromUrl
  }

  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemeId(storedTheme)) {
      return storedTheme
    }
  } catch {
    // localStorage can be unavailable in privacy-restricted browsers.
  }

  return DEFAULT_THEME
}

/**
 * Keeps the selected UI variant in sync across the DOM, URL, and localStorage.
 */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>(() => getInitialTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme

    const url = new URL(window.location.href)
    url.searchParams.set(THEME_QUERY_KEY, theme)
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Theme persistence is optional, so storage failures should not break rendering.
    }
  }, [theme])

  return { theme, setTheme }
}
