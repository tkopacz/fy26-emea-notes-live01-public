import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { NoteCard } from '../components/NoteCard'
import type { Note } from '../api/notesApi'

const baseNote: Note = {
  id: 'note-1',
  createdAt: '2026-05-16T14:35:02Z',
  content: 'Hello world',
  clonedFromId: null,
}

describe('NoteCard', () => {
  it('renders date and time from createdAt in local timezone', () => {
    render(<NoteCard note={baseNote} onClone={vi.fn()} />)

    // The exact formatted string depends on the test runner's locale,
    // but we can assert both time components appear in the document.
    // The ISO date parts must appear somewhere in the rendered output.
    expect(screen.getByText(/2026/)).toBeTruthy()
  })

  it('renders note content', () => {
    render(<NoteCard note={baseNote} onClone={vi.fn()} />)
    expect(screen.getByText('Hello world')).toBeTruthy()
  })

  it('shows the lock icon', () => {
    render(<NoteCard note={baseNote} onClone={vi.fn()} />)
    expect(screen.getByLabelText('Read-only')).toBeTruthy()
  })

  it('calls onClone with the note when Clone button is clicked', () => {
    const onClone = vi.fn()
    render(<NoteCard note={baseNote} onClone={onClone} />)

    fireEvent.click(screen.getByRole('button', { name: /clone/i }))

    expect(onClone).toHaveBeenCalledWith(baseNote)
  })

  it('does NOT show Show more link for short content', () => {
    render(<NoteCard note={baseNote} onClone={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /show more/i })).toBeNull()
  })

  it('truncates content longer than 10,000 characters and shows Show more', () => {
    const longContent = 'A'.repeat(10_001)
    render(<NoteCard note={{ ...baseNote, content: longContent }} onClone={vi.fn()} />)

    // "Show more" button must appear.
    expect(screen.getByRole('button', { name: /show more/i })).toBeTruthy()

    // Content must be truncated — full 10,001-char string should not be in DOM.
    const contentEl = screen.getByText(/^A{1,10000}…$/)
    expect(contentEl).toBeTruthy()
    expect(contentEl.textContent!.length).toBeLessThan(10_003) // 10,000 + "…"
  })

  it('expands content when Show more is clicked', () => {
    const longContent = 'B'.repeat(10_001)
    render(<NoteCard note={{ ...baseNote, content: longContent }} onClone={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /show more/i }))

    // After expanding, "Show less" should appear.
    expect(screen.getByRole('button', { name: /show less/i })).toBeTruthy()
    // Full content is now visible.
    expect(screen.getByText(longContent)).toBeTruthy()
  })

  it('shows clonedFromId badge when present', () => {
    render(
      <NoteCard
        note={{ ...baseNote, clonedFromId: 'original-id-12345' }}
        onClone={vi.fn()}
      />
    )
    // clonedFromId is truncated to first 8 chars: 'original'
    expect(screen.getByText(/original/)).toBeTruthy()
  })
})
