import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './features/identity/AuthContext'
import { useAuth } from './features/identity/useAuth'
import { LoginPage } from './features/identity/LoginPage'
import { RegisterPage } from './features/identity/RegisterPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Nav />
        <main>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Home />} />
            </Route>
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
