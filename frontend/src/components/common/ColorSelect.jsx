/**
 * Color Select Component
 * 
 * Custom dropdown for color selection with visual color squares.
 * Replaces standard select to show representative color swatches.
 */

import { useState, useRef, useEffect } from 'react';
import { theme } from '../../styles/theme';

// Color mapping: color value -> hex color code
// Must match the values from backend/app/models/color_options.py
const COLOR_HEX_MAP = {
  'red': '#DC2626',
  'orange': '#EA580C',
  'yellow': '#EAB308',
  'green': '#16A34A',
  'blue': '#2563EB',
  'violet': '#9333EA', // Backend uses 'violet', not 'purple'
  'pink': '#EC4899',
  'brown': '#92400E',
  'black': '#1F2937',
  'white': '#FFFFFF',
  'gray': '#6B7280',
  'beige': '#F5E6D3',
  'rainbow': 'linear-gradient(90deg, #DC2626, #EA580C, #EAB308, #16A34A, #2563EB, #9333EA)',
  'variegated': 'linear-gradient(45deg, #DC2626 25%, #2563EB 25%, #2563EB 50%, #DC2626 50%, #DC2626 75%, #2563EB 75%)',
  'neutral': '#D1D5DB',
};

const ColorSelect = ({ value, onChange, options, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value) || { value: '', label: 'All colors' };
  const selectedColor = COLOR_HEX_MAP[selectedOption.value] || theme.colors.border;

  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', ...style }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          fontSize: theme.typography.fontSize.base,
          backgroundColor: theme.colors.surface,
          color: theme.colors.textPrimary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            ...(COLOR_HEX_MAP[selectedOption.value]?.startsWith?.('linear-gradient') 
              ? { background: COLOR_HEX_MAP[selectedOption.value] }
              : { backgroundColor: COLOR_HEX_MAP[selectedOption.value] || theme.colors.border }
            ),
            border: selectedOption.value === 'white' || !selectedOption.value
              ? `1px solid ${theme.colors.borderNeutral}` 
              : '1px solid rgba(0, 0, 0, 0.1)',
            flexShrink: 0,
            minWidth: '20px',
            minHeight: '20px',
            display: 'block',
          }}
        />
        <span style={{ flex: 1, color: theme.colors.textPrimary }}>{selectedOption.label}</span>
        <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.25rem',
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            boxShadow: theme.shadows.md,
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => handleSelect('')}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: 'none',
              backgroundColor: value === '' ? theme.colors.background : theme.colors.surface,
              color: theme.colors.textPrimary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = theme.colors.background;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = value === '' ? theme.colors.background : theme.colors.surface;
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                backgroundColor: theme.colors.border,
                border: `1px solid ${theme.colors.borderNeutral}`,
                flexShrink: 0,
              }}
            />
            <span style={{ color: theme.colors.textPrimary }}>All colors</span>
          </button>
          {options.map((opt) => {
            const colorHex = COLOR_HEX_MAP[opt.value];
            if (!colorHex) {
              console.warn(`Color not found for value: ${opt.value}`);
            }
            const isGradient = colorHex && typeof colorHex === 'string' && colorHex.startsWith('linear-gradient');
            const colorSquareStyle = isGradient 
              ? { background: colorHex }
              : { backgroundColor: colorHex || '#E0D9CF' };
            
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: 'none',
                  backgroundColor: value === opt.value ? theme.colors.background : theme.colors.surface,
                  color: theme.colors.textPrimary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = theme.colors.background;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = value === opt.value ? theme.colors.background : theme.colors.surface;
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    ...colorSquareStyle,
                    border: opt.value === 'white' ? `1px solid ${theme.colors.borderNeutral}` : '1px solid rgba(0, 0, 0, 0.1)',
                    flexShrink: 0,
                    minWidth: '20px',
                    minHeight: '20px',
                    display: 'block',
                  }}
                />
                <span style={{ color: theme.colors.textPrimary }}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ColorSelect;
