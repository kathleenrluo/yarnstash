/**
 * Earthy Theme Colors
 * 
 * Clean, simple, earthy color palette for the application.
 */

export const theme = {
  colors: {
    // Earth tones
    primary: '#8B7355',      // Warm brown
    primaryLight: '#A68B6F', // Lighter brown
    primaryDark: '#6B5A42', // Darker brown
    
    secondary: '#9CAF88',    // Sage green
    secondaryLight: '#B5C9A3',
    secondaryDark: '#7A8F6A',
    
    accent: '#D4A574',       // Warm beige
    accentLight: '#E5C19A',
    accentDark: '#C1945A',
    
    // Neutrals
    background: '#F5F1EB',   // Cream/beige background
    surface: '#FFFFFF',       // White cards
    surfaceHover: '#FAF8F5', // Slightly darker on hover
    
    // Text
    textPrimary: '#3E3E3E',   // Dark gray
    textSecondary: '#6B6B6B', // Medium gray
    textLight: '#9B9B9B',     // Light gray
    
    // Status
    success: '#16A34A',       // Bright green (for completed status)
    successMuted: '#7A8F6A',  // Muted green
    error: '#DC2626',         // Bright red (for errors/danger)
    errorMuted: '#C97D60',    // Warm red (muted)
    errorBackground: '#FEE2E2', // Light red background
    warning: '#D4A574',       // Beige/yellow
    info: '#8B7355',          // Brown
    
    // Favorites
    favorite: '#E8A5A5',      // Soft pink/red
    favoriteActive: '#D87A7A', // Darker pink
    
    // Borders
    border: '#E0D9CF',        // Light brown border
    borderLight: '#F0EBE3',   // Very light border
    borderNeutral: '#D1D5DB', // Neutral gray border
  },
  
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.85rem',    // ~13.6px
      base: '0.9rem',   // 14.4px
      md: '1rem',       // 16px
      lg: '1.1rem',     // 17.6px
      xl: '1.2rem',     // 19.2px
      '2xl': '1.5rem',  // 24px
      '3xl': '2rem',    // 32px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.4',
      relaxed: '1.6',
    },
  },
  
  spacing: {
    xs: '0.25rem',     // 4px
    sm: '0.5rem',      // 8px
    md: '1rem',        // 16px
    lg: '1.5rem',      // 24px
    xl: '2rem',        // 32px
    xxl: '3rem',       // 48px
    // Additional spacing values
    '3xs': '0.375rem', // 6px
    '2xs': '0.75rem',  // 12px
    '2md': '1.25rem',  // 20px
  },
  
  borderRadius: {
    xs: '4px',         // 4px
    sm: '6px',         // 6px
    md: '8px',         // 8px
    lg: '12px',        // 12px
    xl: '16px',        // 16px
    '2xl': '24px',     // 24px
    full: '9999px',    // Full circle
    circle: '50%',     // Perfect circle
  },
  
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.08)',
    md: '0 4px 8px rgba(0, 0, 0, 0.12)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.15)',
    xl: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  
  transitions: {
    fast: '0.15s ease',
    normal: '0.2s ease',
    medium: '0.3s ease',
    slow: '0.5s ease',
    borderColor: 'border-color 0.2s ease',
  },
};
