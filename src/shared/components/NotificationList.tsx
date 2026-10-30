import { useEffect, useRef, useState } from 'react'
import { useNotifications } from './useNotifications'
import styles from './NotificationList.module.css'

const AUTO_DISMISS_MS = 2000
const FADE_OUT_MS = 200

// One timer-driven fade-out per notification, keyed by its own id — a
// single shared timer keyed on the whole list would reset every other
// notification's remaining time whenever a new one arrives, making an
// older toast linger far longer than its own 2s if several errors land
// in quick succession. Each notification manages its own lifecycle
// independently: appear → wait AUTO_DISMISS_MS → fade for FADE_OUT_MS →
// actually removed from the shared list (dismiss), so a later notification
// doesn't jump into another's still-fading slot.
function Toast({ id, message, onExpire }: { id: number; message: string; onExpire: (id: number) => void }) {
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    const leaveTimer = setTimeout(() => setIsLeaving(true), AUTO_DISMISS_MS)
    return () => clearTimeout(leaveTimer)
  }, [])

  useEffect(() => {
    if (!isLeaving) return
    const removeTimer = setTimeout(() => onExpire(id), FADE_OUT_MS)
    return () => clearTimeout(removeTimer)
  }, [isLeaving, id, onExpire])

  return (
    <li className={`${styles.toast} ${isLeaving ? styles.toastLeaving : ''}`}>
      <span className={styles.toastMessage}>{message}</span>
      <button type="button" className={styles.toastDismiss} onClick={() => onExpire(id)} aria-label="Dismiss">
        ×
      </button>
    </li>
  )
}

// Bottom-right stack of auto-dismissing error toasts — every non-field-
// validation API error already flows here automatically (see
// client.ts/apiRequest), so this is the one place a failure becomes
// visible regardless of which component triggered the request. Field
// errors stay inline on their own form (client.ts explicitly excludes
// them from this path) since a global toast has no natural way to point
// at which input was wrong.
export function NotificationList() {
  const { notifications, dismiss } = useNotifications()
  // Tracks ids already mid-removal so a fast double-fire (expiry timer and
  // a manual dismiss click landing in the same tick) can't call dismiss
  // twice for the same id — harmless either way, but avoids relying on
  // the parent's own list state to de-duplicate what is otherwise a pure
  // visual concern.
  const removing = useRef(new Set<number>())

  function handleExpire(id: number) {
    if (removing.current.has(id)) return
    removing.current.add(id)
    dismiss(id)
  }

  if (notifications.length === 0) return null

  return (
    <ul className={styles.toastStack} role="alert" aria-live="assertive">
      {notifications.map((n) => (
        <Toast key={n.id} id={n.id} message={n.message} onExpire={handleExpire} />
      ))}
    </ul>
  )
}
