import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import styles from './ComposeArea.module.css'

const DRAFT_KEY = 'noteapp_draft'

export interface ComposeAreaHandle {
  /** Scrolls to and focuses the textarea (used by Clone button). */
  focusAndScroll: (initialContent?: string) => void
}

interface ComposeAreaProps {
  onSave: (content: string, clonedFromId?: string) => Promise<void>
  saving: boolean
}

/**
 * The note composition area at the top of the page.
 *
 * Features:
 * - Save button is disabled when text is empty/whitespace.
 * - Draft is persisted to sessionStorage on every keystroke (GH-006).
 * - Draft is restored on page load; cleared after a successful save.
 * - Exposes focusAndScroll() via ref so NoteCard's Clone button can
 *   scroll to and pre-fill this area (GH-005).
 */
export const ComposeArea = forwardRef<ComposeAreaHandle, ComposeAreaProps>(
  ({ onSave, saving }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    // clonedFromId is set when the user clones a note; cleared after save.
    const clonedFromIdRef = useRef<string | undefined>(undefined)

    // Restore draft from sessionStorage on first render (GH-006).
    const [content, setContent] = useState<string>(() => {
      try {
        return sessionStorage.getItem(DRAFT_KEY) ?? ''
      } catch {
        return ''
      }
    })

    // Persist draft to sessionStorage on every keystroke.
    useEffect(() => {
      try {
        sessionStorage.setItem(DRAFT_KEY, content)
      } catch {
        // sessionStorage unavailable — draft won't survive refresh.
      }
    }, [content])

    // Expose focusAndScroll to parent via the forwarded ref.
    useImperativeHandle(ref, () => ({
      focusAndScroll(initialContent?: string) {
        if (initialContent !== undefined) {
          setContent(initialContent)
          clonedFromIdRef.current = undefined  // will be set by the caller
        }
        // Scroll to and focus the textarea.
        textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        textareaRef.current?.focus()
      },
    }))

    const handleSave = async () => {
      const trimmed = content.trim()
      if (!trimmed) return

      await onSave(trimmed, clonedFromIdRef.current)

      // Clear compose area and draft after successful save.
      setContent('')
      clonedFromIdRef.current = undefined
      try {
        sessionStorage.removeItem(DRAFT_KEY)
      } catch {
        // ignore
      }
    }

    const isEmpty = content.trim().length === 0

    return (
      <section className={styles.section} aria-label="Compose new note">
        <p className={styles.hint}>
          Your notes are saved permanently and cannot be edited.
        </p>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="New note…"
          aria-label="New note"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          disabled={saving}
        />
        <div className={styles.actions}>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={isEmpty || saving}
            aria-label="Save note"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </section>
    )
  }
)

ComposeArea.displayName = 'ComposeArea'
