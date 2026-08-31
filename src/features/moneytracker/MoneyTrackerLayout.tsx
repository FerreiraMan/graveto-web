import { NavLink, Outlet } from 'react-router-dom'
import styles from './MoneyTracker.module.css'

function tabLinkClassName({ isActive }: { isActive: boolean }): string {
  return isActive ? styles.active : ''
}

// Tab shell for the Money Tracker domain — Accounts and Categories are both
// moneytracker concerns, rendered as nested routes via <Outlet />. Mirrors
// the top Nav's active/inactive treatment (Nav.module.css) rather than
// inventing a separate tab visual language.
export function MoneyTrackerLayout() {
  return (
    <div>
      <nav className={styles.tabs} aria-label="Money Tracker sections">
        <NavLink to="/moneytracker" end className={tabLinkClassName}>
          Accounts
        </NavLink>
        <NavLink to="/moneytracker/categories" end className={tabLinkClassName}>
          Categories
        </NavLink>
      </nav>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
