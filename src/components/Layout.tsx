import { useState } from 'react';
import { NavLink, Outlet, useNavigation } from 'react-router';

const LINKS = [
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/players', label: 'Players' },
  { to: '/boardgames', label: 'Board games' },
];

export function Layout() {
  const [expanded, setExpanded] = useState(false);
  const navigation = useNavigation();
  const busy = navigation.state !== 'idle';

  return (
    <>
      <nav className="navbar navbar-expand-md navbar-dark bg-primary mb-4">
        <div className="container">
          <NavLink className="navbar-brand fw-semibold" to="/" onClick={() => setExpanded(false)}>
            Meeple League
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            aria-controls="main-nav"
            aria-expanded={expanded}
            aria-label="Toggle navigation"
            onClick={() => setExpanded((value) => !value)}
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div id="main-nav" className={`collapse navbar-collapse${expanded ? ' show' : ''}`}>
            <ul className="navbar-nav me-auto">
              {LINKS.map(({ to, label }) => (
                <li key={to} className="nav-item">
                  <NavLink className="nav-link" to={to} onClick={() => setExpanded(false)}>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
            {busy && (
              <div className="spinner-border spinner-border-sm text-light" role="status">
                <span className="visually-hidden">Loading…</span>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="container pb-5">
        <Outlet />
      </main>
    </>
  );
}
