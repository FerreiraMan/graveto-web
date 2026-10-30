import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { AuthProvider } from './features/identity/AuthContext'
import { useAuth } from './features/identity/useAuth'
import { LoginPage } from './features/identity/LoginPage'
import { RegisterPage } from './features/identity/RegisterPage'
import { HomePage } from './HomePage'
import { LogoutControl } from './LogoutControl'
import { MoneyTrackerLayout } from './features/moneytracker/MoneyTrackerLayout'
import { AccountListPage } from './features/moneytracker/accounts/AccountListPage'
import { CategoryListPage } from './features/moneytracker/categories/CategoryListPage'
import { CreateCategoryPage } from './features/moneytracker/categories/CreateCategoryPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { GuestRoute } from './routes/GuestRoute'
import { NotificationProvider } from './shared/components/NotificationContext'
import { NotificationList } from './shared/components/NotificationList'
import { useNotifications } from './shared/components/useNotifications'
import { registerGlobalErrorHandlers } from './shared/api/errorHandlers'
import navStyles from './Nav.module.css'

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return isActive ? navStyles.active : ''
}

function Nav() {
  const { isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  useEffect(() => {
    if (!confirmingLogout) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirmingLogout(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [confirmingLogout])

  // A logout actually ending the session should also close any pending
  // confirm UI — Nav/HomePage aren't unmounted on logout (they just stop
  // rendering their contents while !isAuthenticated), so without this the
  // next login would resume with the confirm prompt already expanded.
  function handleLogout() {
    setConfirmingLogout(false)
    logout()
  }

  // The hub at "/" *is* the app's primary navigation (Money Tracker /
  // Portfolio / Logout as its own rows) — showing this bar there too
  // would be a second, redundant nav. It only appears once the user has
  // picked a feature, so they can jump straight to another one or log
  // out without detouring back through the hub first.
  if (!isAuthenticated || location.pathname === '/') return null

  return (
    <nav className={navStyles.nav} aria-label="Main">
      <NavLink to="/" className={navLinkClassName}>
        Home
      </NavLink>
      <NavLink to="/moneytracker" className={navLinkClassName}>
        Money Tracker
      </NavLink>
      <LogoutControl
        className={navStyles.logout}
        confirming={confirmingLogout}
        onRequestConfirm={() => setConfirmingLogout(true)}
        onCancel={() => setConfirmingLogout(false)}
        onLogout={handleLogout}
      />
    </nav>
  )
}

// Bridges the plain-function API client to the React contexts: registers
// notify/logout once so client.ts can call them outside of component scope.
function GlobalErrorHandlerSetup() {
  const { notify } = useNotifications()
  const { logout } = useAuth()

  useEffect(() => {
    registerGlobalErrorHandlers({
      notify,
      onUnauthorized: logout,
    })
  }, [notify, logout])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <GlobalErrorHandlerSetup />
          <NotificationList />
          <Nav />
          <main>
            <Routes>
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/moneytracker" element={<MoneyTrackerLayout />}>
                  <Route index element={<AccountListPage />} />
                  <Route path="categories" element={<CategoryListPage />} />
                  <Route path="categories/new" element={<CreateCategoryPage />} />
                </Route>
              </Route>
            </Routes>
          </main>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
