/**
 * Kat's Gallery — read-only view of showcase stash and projects.
 * Single nav tab with two sub-views: Stash and Projects.
 */

import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import StashPage from './StashPage';
import ProjectsPage from './ProjectsPage';
import { theme } from '../styles/theme';

const GALLERY_PATH = '/gallery';

const styles = {
  container: {
    minHeight: 'calc(100vh - 200px)',
    padding: '2rem 1.5rem',
    backgroundColor: '#F5F1EB',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    borderBottom: `1px solid ${theme.colors.border}`,
    paddingBottom: 0,
  },
  tab: {
    padding: '0.75rem 1.25rem',
    textDecoration: 'none',
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
    borderRadius: theme.borderRadius.lg,
    transition: theme.transitions.normal,
  },
  tabActive: {
    color: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
};

export default function GalleryPage() {
  const location = useLocation();
  const isStash = location.pathname === `${GALLERY_PATH}/stash`;
  const isProjects = location.pathname === `${GALLERY_PATH}/projects`;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <nav style={styles.tabs}>
          <NavLink
            to={`${GALLERY_PATH}/stash`}
            style={({ isActive }) => ({
              ...styles.tab,
              ...(isActive || isStash ? styles.tabActive : {}),
            })}
          >
            Stash
          </NavLink>
          <NavLink
            to={`${GALLERY_PATH}/projects`}
            style={({ isActive }) => ({
              ...styles.tab,
              ...(isActive || isProjects ? styles.tabActive : {}),
            })}
          >
            Projects
          </NavLink>
        </nav>

        <Routes>
          <Route index element={<Navigate to="stash" replace />} />
          <Route path="stash" element={<StashPage galleryMode />} />
          <Route path="projects" element={<ProjectsPage galleryMode />} />
        </Routes>
      </div>
    </div>
  );
}
