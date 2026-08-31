import styles from './LogoutControl.module.css'

// Logout is the only destructive, irreversible action reachable from the
// hub and the top nav — one misclick ends the session with no undo. Both
// places share this control so the confirm/cancel behavior (and any
// future change to it) doesn't drift between them. No modal: an inline
// swap keeps it lightweight for an action that doesn't need to interrupt
// or protect focus, matching every other confirmation surface in this app.
//
// Confirming state is controlled by the caller (not owned here) because
// HomePage also needs to react to it — collapsing its greeting out of the
// way so it can never compete for space with the confirm/cancel buttons.
export function LogoutControl({
  confirming,
  onRequestConfirm,
  onCancel,
  onLogout,
  className,
}: {
  confirming: boolean
  onRequestConfirm: () => void
  onCancel: () => void
  onLogout: () => void
  className?: string
}) {
  if (!confirming) {
    return (
      <button type="button" className={`${styles.logout} ${className ?? ''}`} onClick={onRequestConfirm}>
        Log out
      </button>
    )
  }

  return (
    <span className={`${styles.confirm} ${className ?? ''}`} role="group" aria-label="Confirm logout">
      <span aria-hidden="true">Log out?</span>
      <button type="button" className={styles.confirmYes} onClick={onLogout}>
        Log out
      </button>
      <button type="button" className={styles.confirmNo} onClick={onCancel}>
        Cancel
      </button>
    </span>
  )
}
