import { useNotifications } from './useNotifications'

// No visual styling by design — plain list, functionality only for now.
export function NotificationList() {
  const { notifications, dismiss } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <ul role="alert">
      {notifications.map((n) => (
        <li key={n.id}>
          {n.message}
          <button type="button" onClick={() => dismiss(n.id)}>
            Dismiss
          </button>
        </li>
      ))}
    </ul>
  )
}
