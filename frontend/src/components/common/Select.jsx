/**
 * Select Component
 * 
 * Styled select dropdown that matches the ColorSelect appearance.
 * Includes dropdown icon on the right side.
 * 
 * @param {string} size - 'small' (default, for filters) or 'large' (for forms)
 */

import { theme } from '../../styles/theme';

const Select = ({ value, onChange, options, style, placeholder = 'Select...', size = 'small' }) => {
  const isLarge = size === 'large';
  const padding = isLarge ? theme.spacing['2xs'] : theme.spacing.sm;
  const fontSize = isLarge ? theme.typography.fontSize.md : theme.typography.fontSize.base;
  
  return (
    <div style={{ position: 'relative', ...style }}>
      <select
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          padding: padding,
          paddingRight: '2rem', // Make room for dropdown icon
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          fontSize: fontSize,
          backgroundColor: theme.colors.surface,
          color: theme.colors.textPrimary,
          cursor: 'pointer',
          fontFamily: theme.typography.fontFamily.primary,
          appearance: 'none', // Remove default arrow
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          transition: theme.transitions.normal,
        }}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      <span
        style={{
          position: 'absolute',
          right: theme.spacing['2xs'],
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.textSecondary,
        }}
      >
        ▼
      </span>
    </div>
  );
};

export default Select;
