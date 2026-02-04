/**
 * Modal Component
 * 
 * Popup modal that overlays the current page.
 * Used for adding/editing yarns and projects.
 */

import { theme } from '../../styles/theme';

const Modal = ({ isOpen, onClose, title, children, headerActions }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCloseClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div style={modalStyles.overlay} onClick={handleOverlayClick}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div style={modalStyles.headerLeft}>
            <h2 style={modalStyles.title}>{title}</h2>
            {headerActions && (
              <div style={modalStyles.headerActions}>
                {headerActions}
              </div>
            )}
          </div>
          <button style={modalStyles.closeButton} onClick={handleCloseClick}>
            ×
          </button>
        </div>
        <div style={modalStyles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: theme.spacing.md,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: theme.shadows.lg,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottom: `1px solid ${theme.colors.border}`,
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  headerActions: {
    display: 'flex',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: theme.typography.fontFamily.primary,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: theme.typography.fontSize['3xl'],
    color: theme.colors.textSecondary,
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    transition: theme.transitions.normal,
    fontFamily: theme.typography.fontFamily.primary,
  },
  content: {
    padding: theme.spacing.lg,
    overflow: 'auto',
    flex: 1,
  },
};

export default Modal;
