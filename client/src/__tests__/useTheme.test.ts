import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTheme } from '../hooks/useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    window.history.replaceState({}, '', '/')
  })

  it('defaults to the GitHub variant when no theme preference exists', async () => {
    const { result } = renderHook(() => useTheme())

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('github'))
    expect(result.current.theme).toBe('github')
    expect(localStorage.getItem('noteapp_theme')).toBe('github')
  })

  it('prefers a shareable theme from the URL over localStorage', async () => {
    localStorage.setItem('noteapp_theme', 'microsoft')
    window.history.replaceState({}, '', '/?theme=apple')

    const { result } = renderHook(() => useTheme())

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('apple'))
    expect(result.current.theme).toBe('apple')
  })

  it('restores the saved theme from localStorage when the URL is neutral', async () => {
    localStorage.setItem('noteapp_theme', 'microsoft')

    const { result } = renderHook(() => useTheme())

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('microsoft'))
    expect(result.current.theme).toBe('microsoft')
  })

  it('syncs theme changes back to the DOM, URL, and localStorage', async () => {
    const { result } = renderHook(() => useTheme())

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('github'))

    act(() => {
      result.current.setTheme('apple')
    })

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('apple'))
    expect(window.location.search).toContain('theme=apple')
    expect(localStorage.getItem('noteapp_theme')).toBe('apple')
  })
})
