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
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>Comment box</p>
            <h2 className={styles.title}>Leave a note</h2>
          </div>
          <p className={styles.hint}>
            Your notes are saved permanently and cannot be edited.
          </p>
        </div>
        <div className={styles.commentBox}>
          <div className={styles.commentHeader}>
            <span className={styles.commentIcon} aria-hidden="true">
              <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
                <path
                  fill="currentColor"
                  d="M2 1.75A1.75 1.75 0 0 1 3.75 0h8.5C13.216 0 14 .784 14 1.75v7.5A1.75 1.75 0 0 1 12.25 11H8.06l-2.78 2.77A.75.75 0 0 1 4 13.25V11H3.75A1.75 1.75 0 0 1 2 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25H4.75a.75.75 0 0 1 .75.75v1.19l1.72-1.72a.75.75 0 0 1 .53-.22h4.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"
                />
              </svg>
            </span>
            <span className={styles.commentHeaderText}>Compose</span>
          </div>
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
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={isEmpty || saving}
              aria-label="Save note"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </section>
    )
  }
)

ComposeArea.displayName = 'ComposeArea'
