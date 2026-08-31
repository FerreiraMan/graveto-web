import { createContext, useState, type ReactNode } from 'react'
import { login as apiLogin, register as apiRegister } from './api'
import { clearToken, getToken, setToken } from '../../shared/api/token'

export interface AuthContextValue {
  isAuthenticated: boolean
  email: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getToken() !== null)
  // The backend only stores email, no display name, and login's response
  // carries just a token — so the greeting on the hub page uses the email
  // the user just typed rather than a decoded token claim (avoids guessing
  // the JWT's payload shape). It's session-only, not persisted: a page
  // refresh keeps isAuthenticated (via the stored token) but loses this,
  // same tradeoff a token-derived value would have without the extra
  // assumption about what the token actually contains.
  const [email, setEmail] = useState<string | null>(null)

  async function login(email: string, password: string) {
    const { token } = await apiLogin({ email, password })
    setToken(token)
    setIsAuthenticated(true)
    setEmail(email)
  }

  async function register(email: string, password: string) {
    await apiRegister({ email, password })
  }

  function logout() {
    clearToken()
    setIsAuthenticated(false)
    setEmail(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, email, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

