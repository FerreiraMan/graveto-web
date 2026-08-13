import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './features/identity/AuthContext'
import { useAuth } from './features/identity/useAuth'
import { LoginPage } from './features/identity/LoginPage'
import { RegisterPage } from './features/identity/RegisterPage'
import { MoneyTrackerLayout } from './features/moneytracker/MoneyTrackerLayout'
import { AccountListPage } from './features/moneytracker/accounts/AccountListPage'
import { CreateAccountPage } from './features/moneytracker/accounts/CreateAccountPage'
import { CategoryListPage } from './features/moneytracker/categories/CategoryListPage'
import { CreateCategoryPage } from './features/moneytracker/categories/CreateCategoryPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { NotificationProvider } from './shared/components/NotificationContext'
import { NotificationList } from './shared/components/NotificationList'
import { useNotifications } from './shared/components/useNotifications'
import { registerGlobalErrorHandlers } from './shared/api/errorHandlers'

function Home() {
  const { logout } = useAuth()
  return (
    <div>
      <p>Graveto — pick a section above.</p>
      <button type="button" onClick={logout}>
        Log out
      </button>
    </div>
  )
}

function Nav() {
  const { isAuthenticated } = useAuth()
  return (
    <nav>
      <Link to="/">Home</Link>
      {' | '}
      <Link to="/moneytracker">Money Tracker</Link>
      {' | '}
      <Link to="/portfolio">Portfolio</Link>
      {!isAuthenticated && (
        <>
          {' | '}
          <Link to="/login">Log in</Link>
          {' | '}
          <Link to="/register">Register</Link>
        </>
      )}
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
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/moneytracker" element={<MoneyTrackerLayout />}>
                  <Route index element={<AccountListPage />} />
                  <Route path="accounts/new" element={<CreateAccountPage />} />
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
