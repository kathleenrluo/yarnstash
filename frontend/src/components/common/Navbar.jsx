/**
 * Navigation Bar Component
 * 
 * Provides navigation between different pages with earthy theme.
 */

import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/stash', label: 'Stash' },
    { path: '/projects', label: 'Projects' },
    { path: '/calculator', label: 'Calculator' },
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <h1 style={styles.title}>🧶 Kat's Yarn Box</h1>
        <ul style={styles.navList}>
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                style={{
                  ...styles.navLink,
                  ...(location.pathname === item.path ? styles.activeLink : {}),
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E0D9CF',
    padding: '1rem 1.5rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#8B7355',
    fontWeight: '600',
  },
  navList: {
    display: 'flex',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    gap: '0.5rem',
  },
  navLink: {
    textDecoration: 'none',
    color: '#6B6B6B',
    fontWeight: '500',
    padding: '0.75rem 1.25rem',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    display: 'block',
  },
  activeLink: {
    color: '#8B7355',
    backgroundColor: '#F5F1EB',
  },
};

export default Navbar;
