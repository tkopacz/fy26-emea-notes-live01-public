import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNotes } from '../hooks/useNotes'
import * as api from '../api/notesApi'

const TEST_USER = '3fa85f64-5717-4562-b3fc-2c963f66afa6'

const mockNote = (overrides = {}): api.Note => ({
  id: 'note-1',
  createdAt: '2026-05-16T10:00:00Z',
  content: 'Test content',
  clonedFromId: null,
  ...overrides,
})

describe('useNotes', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches notes on mount when userId is provided', async () => {
    const notes = [mockNote()]
    vi.spyOn(api, 'getNotes').mockResolvedValue(notes)

    const { result } = renderHook(() => useNotes(TEST_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(api.getNotes).toHaveBeenCalledWith(TEST_USER)
    expect(result.current.notes).toEqual(notes)
    expect(result.current.error).toBeNull()
  })

  it('does NOT fetch notes when userId is empty', () => {
    vi.spyOn(api, 'getNotes').mockResolvedValue([])

    renderHook(() => useNotes(''))

    expect(api.getNotes).not.toHaveBeenCalled()
  })

  it('sets error state when getNotes rejects', async () => {
    vi.spyOn(api, 'getNotes').mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useNotes(TEST_USER))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Network error')
    expect(result.current.notes).toEqual([])
  })

  it('saveNote calls createNote with correct args and refreshes notes', async () => {
    const newNote = mockNote({ id: 'note-2', content: 'New note' })
    vi.spyOn(api, 'getNotes').mockResolvedValue([newNote])
    vi.spyOn(api, 'createNote').mockResolvedValue(newNote)

    const { result } = renderHook(() => useNotes(TEST_USER))

    await act(async () => {
      await result.current.saveNote('New note')
    })

    expect(api.createNote).toHaveBeenCalledWith(TEST_USER, {
      content: 'New note',
      clonedFromId: undefined,
    })
    expect(result.current.notes).toEqual([newNote])
  })

  it('saveNote passes clonedFromId when provided', async () => {
    vi.spyOn(api, 'getNotes').mockResolvedValue([])
    vi.spyOn(api, 'createNote').mockResolvedValue(mockNote())

    const { result } = renderHook(() => useNotes(TEST_USER))

    await act(async () => {
      await result.current.saveNote('Cloned content', 'original-id')
    })

    expect(api.createNote).toHaveBeenCalledWith(TEST_USER, {
      content: 'Cloned content',
      clonedFromId: 'original-id',
    })
  })
})
