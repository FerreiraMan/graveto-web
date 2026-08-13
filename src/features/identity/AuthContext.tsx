import { createContext, useState, type ReactNode } from 'react'
import { login as apiLogin, register as apiRegister } from './api'
import { clearToken, getToken, setToken } from '../../shared/api/token'

export interface AuthContextValue {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getToken() !== null)

  async function login(email: string, password: string) {
    const { token } = await apiLogin({ email, password })
    setToken(token)
    setIsAuthenticated(true)
  }

  async function register(email: string, password: string) {
    await apiRegister({ email, password })
  }

  function logout() {
    clearToken()
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

