import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeSwitcher } from '../components/ThemeSwitcher'

describe('ThemeSwitcher', () => {
  it('renders all requested UI variant buttons', () => {
    render(<ThemeSwitcher theme="github" onThemeChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Microsoft' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apple' })).toBeInTheDocument()
  })

  it('marks only the active variant as pressed', () => {
    render(<ThemeSwitcher theme="microsoft" onThemeChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Microsoft' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'GitHub' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Apple' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('reports the selected variant when a button is clicked', async () => {
    const onThemeChange = vi.fn()
    render(<ThemeSwitcher theme="github" onThemeChange={onThemeChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Apple' }))

    expect(onThemeChange).toHaveBeenCalledWith('apple')
  })
})
