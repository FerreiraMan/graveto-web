import { NavLink, Outlet } from 'react-router-dom'

// Tab shell for the Money Tracker domain — Accounts and Categories are both
// moneytracker concerns, rendered as nested routes via <Outlet />.
export function MoneyTrackerLayout() {
  return (
    <div>
      <nav>
        <NavLink to="/moneytracker" end>
          Accounts
        </NavLink>
        {' | '}
        <NavLink to="/moneytracker/categories">Categories</NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
