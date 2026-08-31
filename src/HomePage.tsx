import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './features/identity/useAuth'
import { LogoutControl } from './LogoutControl'
import styles from './HomePage.module.css'

function greetingForHour(hour: number): string {
  if (hour < 5) return 'Working late'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// The backend stores email only, no display name — the local part of the
// email (before "@") stands in as a name. Split on the common separators
// people use inside a local part (. _ +) and take the first token, so
// "ferreirapedro.sjm" reads as "Ferreirapedro" and "p_ferreira" reads as
// "P" rather than showing the raw string verbatim — still a heuristic,
// not a real name, but closer to one for the common cases. Not meant to
// handle every possible email format, since the alternative (no name at
// all) is worse.
function nameFromEmail(email: string): string {
  const localPart = email.split('@')[0]
  const firstToken = localPart.split(/[._+]/)[0]
  return firstToken.charAt(0).toUpperCase() + firstToken.slice(1)
}

// Post-login hub — the primary navigation surface, not a dashboard. No
// aggregator exists across Money Tracker and Portfolio yet (each feature's
// data lives behind its own endpoints), so this page deliberately shows no
// summary numbers — see PRODUCT.md. It picks a feature, nothing else; the
// per-feature nav bar (App.tsx) takes over once one is chosen.
export function HomePage() {
  const { email, logout } = useAuth()
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  useEffect(() => {
    if (!confirmingLogout) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirmingLogout(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [confirmingLogout])

  const greeting = greetingForHour(new Date().getHours())
  const title = email ? `${greeting}, ${nameFromEmail(email)}` : greeting

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h1 className={confirmingLogout ? styles.titleHidden : styles.title}>{title}</h1>

          <LogoutControl
            confirming={confirmingLogout}
            onRequestConfirm={() => setConfirmingLogout(true)}
            onCancel={() => setConfirmingLogout(false)}
            onLogout={logout}
          />
        </div>

        <ul className={styles.list}>
          <li>
            <Link to="/moneytracker" className={styles.row}>
              <span className={styles.rowText}>
                <span className={styles.rowLabel}>Money Tracker</span>
                <span className={styles.rowDescription}>Accounts, transactions, and cash flow</span>
              </span>
              <span className={styles.chevron} aria-hidden="true">
                ›
              </span>
            </Link>
          </li>
          <li>
            <button type="button" className={styles.row} disabled>
              <span className={styles.rowText}>
                <span className={styles.rowLabel}>Portfolio</span>
                <span className={styles.rowDescription}>Investment tracking</span>
              </span>
              <span className={styles.badge}>Coming soon</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}
