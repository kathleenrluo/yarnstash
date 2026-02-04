/**
 * Tag Component
 * 
 * Displays a tag with rounded corners.
 * Used for project tags (garment, hat, etc.)
 */

import { theme } from '../../styles/theme';

const Tag = ({ label, onRemove, editable = false }) => {
  return (
    <span style={tagStyles.tag}>
      {label}
      {editable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={tagStyles.removeButton}
          aria-label={`Remove tag ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
};

const tagStyles = {
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: '0.375rem 0.75rem',
    backgroundColor: theme.colors.secondary,
    color: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    margin: '0.25rem',
    fontFamily: theme.typography.fontFamily.primary,
  },
  removeButton: {
    background: 'none',
    border: 'none',
    color: theme.colors.surface,
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.xl,
    lineHeight: 1,
    padding: 0,
    marginLeft: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    transition: theme.transitions.normal,
    fontFamily: theme.typography.fontFamily.primary,
  },
};

export default Tag;
