/**
 * Feedback Button Component
 * 
 * Floating button that links to the feedback form.
 * Positioned in the bottom-right corner on all pages.
 */

import { theme } from '../../styles/theme';

const FeedbackButton = () => {
  const handleClick = () => {
    window.open('https://forms.gle/GZzxhweC8uUn2iMm8', '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      style={styles.button}
      className="feedback-button"
      aria-label="Send feedback"
      title="Send feedback or report a bug"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={styles.icon}
      >
        <path
          d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
          fill="currentColor"
        />
        <path
          d="M7 9h10v2H7zm0-4h10v2H7zm0 8h7v2H7z"
          fill="currentColor"
        />
      </svg>
      <span style={styles.text}>Feedback</span>
    </button>
  );
};

const styles = {
  button: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    backgroundColor: theme.colors.primary,
    color: theme.colors.surface,
    border: 'none',
    borderRadius: theme.borderRadius.full,
    boxShadow: theme.shadows.lg,
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    transition: theme.transitions.normal,
    zIndex: 1000,
    fontFamily: theme.typography.fontFamily.primary,
  },
  icon: {
    flexShrink: 0,
  },
  text: {
    whiteSpace: 'nowrap',
  },
};


export default FeedbackButton;
