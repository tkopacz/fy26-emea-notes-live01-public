import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppApple from '../AppApple'
import type { Note } from '../api/notesApi'

const mockUseUserId = vi.fn()
const mockUseNotes = vi.fn()

vi.mock('../hooks/useUserId', () => ({
  useUserId: () => mockUseUserId(),
}))

vi.mock('../hooks/useNotes', () => ({
  useNotes: (userId: string) => mockUseNotes(userId),
}))

const baseNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-1',
  createdAt: '2026-05-16T14:35:02Z',
  content: 'First note body',
  clonedFromId: null,
  ...overrides,
})

describe('AppApple', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mockUseUserId.mockReturnValue({
      userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      truncatedId: '3fa85f64',
      isStorageUnavailable: false,
    })
    mockUseNotes.mockReturnValue({
      notes: [],
      loading: false,
      error: null,
      saveNote: vi.fn().mockResolvedValue(undefined),
    })
  })

  it('renders Apple-style folders, list, editor panes, and the empty state', () => {
    render(<AppApple />)

    expect(screen.getByLabelText(/folders navigation/i)).toBeTruthy()
    expect(screen.getByLabelText(/notes list/i)).toBeTruthy()
    expect(screen.getByLabelText(/editor panel/i)).toBeTruthy()
    expect(screen.getByRole('heading', { name: /all notes/i })).toBeTruthy()
    expect(screen.getByText(/no notes yet/i)).toBeTruthy()
  })

  it('prefills the inline editor when a note is cloned from the list', () => {
    mockUseNotes.mockReturnValue({
      notes: [baseNote()],
      loading: false,
      error: null,
      saveNote: vi.fn().mockResolvedValue(undefined),
    })

    render(<AppApple />)

    fireEvent.click(screen.getByRole('button', { name: /clone note/i }))

    expect(screen.getByRole('textbox', { name: /new note/i })).toHaveValue('First note body')
  })

  it('passes the cloned note id back through saveNote when the draft is saved', async () => {
    const saveNote = vi.fn().mockResolvedValue(undefined)
    mockUseNotes.mockReturnValue({
      notes: [baseNote({ id: 'note-42', content: 'Reusable text' })],
      loading: false,
      error: null,
      saveNote,
    })

    render(<AppApple />)

    fireEvent.click(screen.getByRole('button', { name: /clone note/i }))
    fireEvent.click(screen.getByRole('button', { name: /save note/i }))

    await waitFor(() => expect(saveNote).toHaveBeenCalledWith('Reusable text', 'note-42'))
  })
})
