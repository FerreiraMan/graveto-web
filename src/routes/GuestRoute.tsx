import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/identity/useAuth'

// Mirror of ProtectedRoute: /login and /register only make sense while
// signed out. Without this, navigating back (browser Back, a stale
// bookmark, etc.) after logging in lands back on the login form while
// still fully authenticated — the top Nav (which only hides itself on
// "/") renders over it, and the form itself has nothing useful to do.
export function GuestRoute() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
