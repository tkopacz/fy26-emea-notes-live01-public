import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ComposeArea } from '../components/ComposeArea'

describe('ComposeArea', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('renders a textarea labeled "New note"', () => {
    render(<ComposeArea onSave={vi.fn()} saving={false} />)
    expect(screen.getByRole('textbox', { name: /new note/i })).toBeTruthy()
  })

  it('Save button is disabled when textarea is empty', () => {
    render(<ComposeArea onSave={vi.fn()} saving={false} />)
    const btn = screen.getByRole('button', { name: /save/i })
    expect(btn).toBeDisabled()
  })

  it('Save button is disabled when textarea contains only whitespace', async () => {
    render(<ComposeArea onSave={vi.fn()} saving={false} />)
    const textarea = screen.getByRole('textbox', { name: /new note/i })
    await userEvent.type(textarea, '   ')
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('Save button is enabled when textarea has non-whitespace content', async () => {
    render(<ComposeArea onSave={vi.fn()} saving={false} />)
    const textarea = screen.getByRole('textbox', { name: /new note/i })
    await userEvent.type(textarea, 'My note')
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled()
  })

  it('calls onSave with trimmed content and clears textarea on success', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ComposeArea onSave={onSave} saving={false} />)

    const textarea = screen.getByRole('textbox', { name: /new note/i })
    await userEvent.type(textarea, '  My note  ')
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('My note', undefined))
    await waitFor(() => expect((textarea as HTMLTextAreaElement).value).toBe(''))
  })

  it('persists draft to sessionStorage as user types', async () => {
    render(<ComposeArea onSave={vi.fn()} saving={false} />)
    const textarea = screen.getByRole('textbox', { name: /new note/i })
    await userEvent.type(textarea, 'Draft text')
    expect(sessionStorage.getItem('noteapp_draft')).toBe('Draft text')
  })

  it('restores draft from sessionStorage on mount', () => {
    sessionStorage.setItem('noteapp_draft', 'Saved draft')
    render(<ComposeArea onSave={vi.fn()} saving={false} />)
    const textarea = screen.getByRole('textbox', { name: /new note/i }) as HTMLTextAreaElement
    expect(textarea.value).toBe('Saved draft')
  })

  it('clears sessionStorage draft after successful save', async () => {
    sessionStorage.setItem('noteapp_draft', 'Draft')
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ComposeArea onSave={onSave} saving={false} />)

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(sessionStorage.getItem('noteapp_draft')).toBeNull())
  })
})
