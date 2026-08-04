import { createContext, useCallback, useState, type ReactNode } from 'react'

export interface Notification {
  id: number
  message: string
}

export interface NotificationContextValue {
  notifications: Notification[]
  notify: (message: string) => void
  dismiss: (id: number) => void
}

export const NotificationContext = createContext<NotificationContextValue | null>(null)

let nextId = 0

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const notify = useCallback((message: string) => {
    const id = nextId++
    setNotifications((current) => [...current, { id, message }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setNotifications((current) => current.filter((n) => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss }}>
      {children}
    </NotificationContext.Provider>
  )
}
