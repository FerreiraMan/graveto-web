import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './useAuth'
import { ApiError } from '../../shared/api/errors'
import { isValidEmail } from './validation'
import styles from './AuthForm.module.css'

const MIN_PASSWORD_LENGTH = 5

export function RegisterPage() {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    const nextFieldErrors: Record<string, string> = {}
    if (!isValidEmail(email)) {
      nextFieldErrors.email = 'Please enter a valid email address.'
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      nextFieldErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await register(email, password)
      setSuccess(true)
    } catch (err) {
      if (err instanceof ApiError && err.problem?.invalid_params) {
        setFieldErrors(err.problem.invalid_params)
      } else {
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.form}>
          <h1 className={styles.successTitle}>Registration successful</h1>
          <p className={styles.switchLink}>
            You can now <Link to="/login">log in</Link>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h1 className={styles.title}>Register</h1>

        {error && (
          <p className={styles.error} role="alert">
            {error}
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
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {fieldErrors.email && (
            <span id="email-error" className={styles.fieldError}>
              {fieldErrors.email}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {fieldErrors.password && (
            <span id="password-error" className={styles.fieldError}>
              {fieldErrors.password}
            </span>
          )}
        </div>

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? 'Registering…' : 'Register'}
        </button>

        <p className={styles.switchLink}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}
