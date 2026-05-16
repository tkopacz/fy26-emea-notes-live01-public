import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AppMicrosoft from '../AppMicrosoft'
import { useNotes } from '../hooks/useNotes'
import { useUserId } from '../hooks/useUserId'

vi.mock('../hooks/useNotes', () => ({
  useNotes: vi.fn(),
}))

vi.mock('../hooks/useUserId', () => ({
  useUserId: vi.fn(),
}))

describe('AppMicrosoft', () => {
  beforeEach(() => {
    vi.mocked(useUserId).mockReturnValue({
      userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      truncatedId: '3fa85f64',
      isStorageUnavailable: false,
    })
    vi.mocked(useNotes).mockReturnValue({
      notes: [],
      loading: false,
      error: null,
      saveNote: vi.fn(),
    })

    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      get: () => ({ writeText: vi.fn().mockResolvedValue(undefined) }),
    })
  })

  it('renders the Fluent command bar, breadcrumb, pivots, and empty state', () => {
    render(<AppMicrosoft />)

    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new note/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy id/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /all notes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /compose/i })).toBeInTheDocument()
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument()
  })

  it('shows notes using the current author label in the list pane', () => {
    vi.mocked(useNotes).mockReturnValue({
      notes: [
        {
          id: 'note-1',
          createdAt: '2026-05-16T14:35:02Z',
          content: 'First note',
          clonedFromId: null,
        },
      ],
      loading: false,
      error: null,
      saveNote: vi.fn(),
    })

    render(<AppMicrosoft />)

    expect(screen.getByText(/author you/i)).toBeInTheDocument()
    expect(screen.getByText('1 note')).toBeInTheDocument()
    expect(screen.getByText('First note')).toBeInTheDocument()
  })
})
