/**
 * Favorite Button Component
 * 
 * Clickable heart icon for favoriting yarns and projects.
 */

import { theme } from '../../styles/theme';

const FavoriteButton = ({ isFavorite, onClick }) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) {
          onClick(e);
        }
      }}
      style={{
        ...favoriteStyles.button,
        ...(isFavorite ? favoriteStyles.active : {}),
      }}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFavorite ? '❤️' : '🤍'}
    </button>
  );
};

const favoriteStyles = {
  button: {
    background: 'none',
    border: 'none',
    fontSize: theme.typography.fontSize['2xl'],
    cursor: 'pointer',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    transition: theme.transitions.normal,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 100,
    pointerEvents: 'auto',
  },
  active: {
    transform: 'scale(1.1)',
  },
};

export default FavoriteButton;
