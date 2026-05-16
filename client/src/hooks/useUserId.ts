import { useEffect, useState } from 'react'

const STORAGE_KEY = 'noteapp_user_id'

/**
 * Generates a UUID v4 using the browser's crypto API.
 * This is more reliable than Math.random()-based implementations.
 */
function generateUuid(): string {
  return crypto.randomUUID()
}

/**
 * Returns true if localStorage is available (can be blocked in
 * strict private browsing modes).
 */
function isLocalStorageAvailable(): boolean {
  try {
    const key = '__noteapp_test__'
    localStorage.setItem(key, '1')
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

interface UseUserIdResult {
  /** The full UUID v4 that identifies this user. */
  userId: string
  /** First 8 characters of the UUID, shown in the header. */
  truncatedId: string
  /** True when localStorage was unavailable and the identity is in-memory only. */
  isStorageUnavailable: boolean
}

/**
 * Manages the user's GUID identity.
 *
 * On first use, generates a UUID v4 and persists it to localStorage.
 * On subsequent visits, reuses the stored UUID.
 * If localStorage is unavailable, falls back to an in-memory UUID and
 * sets isStorageUnavailable = true so the UI can show a warning.
 */
export function useUserId(): UseUserIdResult {
  const [userId, setUserId] = useState<string>('')
  const [isStorageUnavailable, setIsStorageUnavailable] = useState(false)

  useEffect(() => {
    const storageOk = isLocalStorageAvailable()

    if (!storageOk) {
      // Generate an in-memory GUID — notes won't persist across sessions.
      setIsStorageUnavailable(true)
      setUserId(generateUuid())
      return
    }

    // Reuse existing GUID or generate a new one on first visit.
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = generateUuid()
      localStorage.setItem(STORAGE_KEY, id)
    }

    setUserId(id)
  }, [])

  return {
    userId,
    truncatedId: userId ? userId.slice(0, 8) : '',
    isStorageUnavailable,
  }
}
