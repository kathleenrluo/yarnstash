/**
 * Navigation Bar Component
 * 
 * Provides navigation between different pages with earthy theme.
 */

import { useState, Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';
import Modal from './Modal';

const Navbar = () => {
  const location = useLocation();
  const { user, loading, login, logout, isAuthenticated } = useAuth();
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);

  const handleSignOutClick = () => setConfirmSignOutOpen(true);
  const handleConfirmSignOut = () => {
    logout();
    setConfirmSignOutOpen(false);
  };
  const handleCancelSignOut = () => setConfirmSignOutOpen(false);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/stash', label: 'Stash' },
    { path: '/projects', label: 'Projects' },
    { path: '/calculator', label: 'Calculator' },
    { path: '/gallery', label: "Kat's Gallery" },
  ];

  return (
    <nav style={styles.nav} className="navbar-responsive">
      <div style={styles.container} className="navbar-container-responsive">
        <h1 style={styles.title} className="navbar-title-responsive">🧶 Kat's Yarn Box</h1>
        <ul style={styles.navList} className="navbar-list-responsive">
          {navItems.map((item) => {
            const isActive = item.path === '/gallery'
              ? location.pathname.startsWith('/gallery')
              : location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path === '/gallery' ? '/gallery' : item.path}
                  style={{
                    ...styles.navLink,
                    ...(isActive ? styles.activeLink : {}),
                  }}
                  className="navbar-link-responsive"
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li style={styles.authItem}>
            {!loading && (
              isAuthenticated ? (
                <Fragment>
                  <span style={styles.userRow}>
                    {user?.picture && (
                      <img
                        src={user.picture}
                        alt=""
                        style={styles.avatar}
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <span style={styles.userName}>{user?.name || user?.email}</span>
                    <button type="button" onClick={handleSignOutClick} style={styles.logoutBtn}>
                      Sign out
                    </button>
                  </span>
                  <Modal
                  isOpen={confirmSignOutOpen}
                  onClose={handleCancelSignOut}
                  title="Sign out?"
                >
                  <p style={styles.confirmMessage}>
                    Are you sure you want to sign out?
                  </p>
                  <div style={styles.confirmActions}>
                    <button
                      type="button"
                      onClick={handleCancelSignOut}
                      style={styles.confirmCancelBtn}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSignOut}
                      style={styles.confirmSignOutBtn}
                    >
                      Sign out
                    </button>
                  </div>
                  </Modal>
                </Fragment>
              ) : (
                <button type="button" onClick={login} style={styles.loginBtn}>
                  Sign in with Google
                </button>
              )
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: theme.colors.surface,
    borderBottom: `1px solid ${theme.colors.border}`,
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    boxShadow: theme.shadows.sm,
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
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  navList: {
    display: 'flex',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    gap: theme.spacing.sm,
  },
  navLink: {
    textDecoration: 'none',
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
    padding: `${theme.spacing['2xs']} ${theme.spacing['2md']}`,
    borderRadius: theme.borderRadius.lg,
    transition: theme.transitions.normal,
    display: 'block',
    fontSize: theme.typography.fontSize.base,
  },
  activeLink: {
    color: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  authItem: {
    marginLeft: 'auto',
    paddingLeft: theme.spacing.lg,
    borderLeft: `1px solid ${theme.colors.border}`,
    display: 'flex',
    alignItems: 'center',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: theme.spacing.xl,
    height: theme.spacing.xl,
    minWidth: theme.spacing.xl,
    minHeight: theme.spacing.xl,
    flexShrink: 0,
    borderRadius: theme.borderRadius.full,
    objectFit: 'cover',
    display: 'block',
  },
  userName: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
    lineHeight: 1.25,
    maxWidth: 140,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  loginBtn: {
    padding: `${theme.spacing['2xs']} ${theme.spacing['2md']}`,
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.primary}`,
    backgroundColor: theme.colors.background,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.base,
    transition: theme.transitions.normal,
  },
  logoutBtn: {
    margin: 0,
    padding: `${theme.spacing['2xs']} ${theme.spacing['2md']}`,
    lineHeight: 1.25,
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: 'transparent',
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: 'pointer',
    transition: theme.transitions.normal,
    fontFamily: 'inherit',
  },
  confirmMessage: {
    margin: `0 0 ${theme.spacing.lg}`,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
  },
  confirmActions: {
    display: 'flex',
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
  confirmCancelBtn: {
    margin: 0,
    padding: `${theme.spacing['2xs']} ${theme.spacing['2md']}`,
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: 'transparent',
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: 'pointer',
    transition: theme.transitions.normal,
    fontFamily: 'inherit',
  },
  confirmSignOutBtn: {
    margin: 0,
    padding: `${theme.spacing['2xs']} ${theme.spacing['2md']}`,
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.primary}`,
    backgroundColor: theme.colors.primary,
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: 'pointer',
    transition: theme.transitions.normal,
    fontFamily: 'inherit',
  },
};

export default Navbar;
