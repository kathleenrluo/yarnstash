/**
 * Demo Banner Component
 * 
 * Displays a banner indicating the app is in demo/read-only mode
 */

import { isDemoMode } from '../../config/demoMode';
import { theme } from '../../styles/theme';

const DemoBanner = () => {
  if (!isDemoMode) return null;

  const styles = {
    banner: {
      backgroundColor: theme.colors.accent,
      color: theme.colors.textPrimary,
      padding: theme.spacing.sm,
      textAlign: 'center',
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      borderBottom: `1px solid ${theme.colors.border}`,
    },
  };

  return (
    <div style={styles.banner}>
      🧶 Demo Mode - Read Only - This is a demonstration of the Yarn Stash Tracker
    </div>
  );
};

export default DemoBanner;
