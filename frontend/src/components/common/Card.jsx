/**
 * Card Component
 * 
 * Reusable card component with rounded corners and earthy styling.
 * Used throughout the application for displaying content.
 */

import { theme } from '../../styles/theme';

const Card = ({ children, onClick, style = {}, noPadding = false }) => {
  return (
    <div
      onClick={onClick}
      style={{
        ...cardStyles.card,
        ...(noPadding ? { padding: 0 } : {}),
        ...(onClick ? cardStyles.clickable : {}),
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = theme.shadows.lg;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = theme.shadows.md;
        }
      }}
    >
      {children}
    </div>
  );
};

const cardStyles = {
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.border}`,
    transition: theme.transitions.normal,
  },
  clickable: {
    cursor: 'pointer',
  },
};

export default Card;
