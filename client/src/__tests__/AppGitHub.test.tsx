import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppGitHub from '../AppGitHub'
import type { Note } from '../api/notesApi'

vi.mock('../hooks/useUserId', () => ({
  useUserId: vi.fn(),
}))

vi.mock('../hooks/useNotes', () => ({
  useNotes: vi.fn(),
}))

const { useUserId } = await import('../hooks/useUserId')
const { useNotes } = await import('../hooks/useNotes')

const mockedUseUserId = vi.mocked(useUserId)
const mockedUseNotes = vi.mocked(useNotes)

const baseNotes: Note[] = [
  {
    id: 'note-1',
    createdAt: '2026-05-16T14:35:02Z',
    content: 'Primer note one',
    clonedFromId: null,
  },
  {
    id: 'note-2',
    createdAt: '2026-05-16T15:35:02Z',
    content: 'Primer note two',
    clonedFromId: null,
  },
]

describe('AppGitHub', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    mockedUseUserId.mockReturnValue({
      userId: '12345678-1234-1234-1234-123456789abc',
      truncatedId: '12345678',
      isStorageUnavailable: false,
    })
    mockedUseNotes.mockReturnValue({
      notes: baseNotes,
      loading: false,
      error: null,
      saveNote: vi.fn().mockResolvedValue(undefined),
    })
  })

  it('renders the GitHub-style sidebar and recent notes summary', () => {
    render(<AppGitHub />)

    expect(screen.getByLabelText('Notes navigation')).toBeTruthy()
    expect(screen.getByRole('heading', { name: /personal note feed/i })).toBeTruthy()
    expect(screen.getByText('All notes')).toBeTruthy()
    expect(screen.getByText('2 notes')).toBeTruthy()
  })

  it('focuses the compose textarea from the sidebar compose action', () => {
    mockedUseNotes.mockReturnValue({
      notes: [],
      loading: false,
      error: null,
      saveNote: vi.fn().mockResolvedValue(undefined),
    })

    render(<AppGitHub />)

    const composeButton = screen.getByRole('button', { name: /^compose$/i })
    fireEvent.click(composeButton)

    expect(screen.getByRole('textbox', { name: /new note/i })).toHaveFocus()
    expect(screen.getByText(/no notes yet/i)).toBeTruthy()
  })

  it('keeps the sidebar hidden in the mobile breakpoint stylesheet', () => {
    const appStyles = readFileSync(resolve(process.cwd(), 'src/App.module.css'), 'utf8')

    expect(appStyles).toMatch(/@media \(max-width: 767px\)/)
    expect(appStyles).toMatch(/\.sidebar \{\s+display: none;/s)
  })
})
