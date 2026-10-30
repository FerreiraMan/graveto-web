import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './useAuth'
import { isValidEmail } from './validation'
import styles from './AuthForm.module.css'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Front-end validation only (never set from a backend response) — a
  // failed login attempt already surfaces via the global toast, so this
  // stays reserved for the one check that happens before any request is
  // even made.
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setValidationError(null)

    if (!isValidEmail(email)) {
      setValidationError('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)

    try {
      await login(email, password)
      navigate('/')
    } catch {
      // Non-field failures already surface via the global notification toast.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h1 className={styles.title}>Log in</h1>

        {validationError && (
          <p className={styles.error} role="alert">
            {validationError}
          </p>
        )}

        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>

        <p className={styles.switchLink}>
          No account yet? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  )
}
