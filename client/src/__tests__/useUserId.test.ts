import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserId } from '../hooks/useUserId'

describe('useUserId', () => {
  beforeEach(() => {
    // Clear localStorage before each test for isolation.
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('generates a new UUID v4 on first visit and stores it in localStorage', () => {
    const { result } = renderHook(() => useUserId())

    const { userId } = result.current
    expect(userId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
    expect(localStorage.getItem('noteapp_user_id')).toBe(userId)
  })

  it('reuses an existing GUID from localStorage on subsequent visits', () => {
    const existingId = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
    localStorage.setItem('noteapp_user_id', existingId)

    const { result } = renderHook(() => useUserId())

    expect(result.current.userId).toBe(existingId)
  })

  it('exposes a truncatedId of exactly 8 characters', () => {
    const { result } = renderHook(() => useUserId())

    expect(result.current.truncatedId).toHaveLength(8)
    expect(result.current.userId.startsWith(result.current.truncatedId)).toBe(true)
  })

  it('falls back to in-memory GUID when localStorage throws', () => {
    // Simulate localStorage being unavailable (e.g. strict private mode).
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })

    const { result } = renderHook(() => useUserId())

    expect(result.current.userId).toBeTruthy()
    expect(result.current.isStorageUnavailable).toBe(true)
  })
})
