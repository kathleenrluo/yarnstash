/**
 * Hook size utilities for crochet - mm to letter/US number mapping.
 * Used for display formatting in project modals.
 */

// Standard US crochet hook sizes: B/1=2.25mm, C/2=2.75mm, D/3=3.25mm, E/4=3.5mm, F/5=3.75mm, G/6=4.0mm, 7=4.5mm, H/8=5.0mm, etc.
const CROCHET_HOOK_SIZES = [
  { mm: 2.0, letter: null, usNumber: null },
  { mm: 2.25, letter: 'B', usNumber: 1 },
  { mm: 2.5, letter: null, usNumber: null },
  { mm: 2.75, letter: 'C', usNumber: 2 },
  { mm: 3.0, letter: null, usNumber: null },
  { mm: 3.25, letter: 'D', usNumber: 3 },
  { mm: 3.5, letter: 'E', usNumber: 4 },
  { mm: 3.75, letter: 'F', usNumber: 5 },
  { mm: 4.0, letter: 'G', usNumber: 6 },
  { mm: 4.25, letter: null, usNumber: null },
  { mm: 4.5, letter: null, usNumber: 7 },
  { mm: 5.0, letter: 'H', usNumber: 8 },
  { mm: 5.5, letter: 'I', usNumber: 9 },
  { mm: 6.0, letter: 'J', usNumber: 10 },
  { mm: 6.5, letter: 'K', usNumber: 10.5 },
  { mm: 7.0, letter: null, usNumber: null },
  { mm: 8.0, letter: 'L', usNumber: 11 },
  { mm: 9.0, letter: 'M', usNumber: 13 },
  { mm: 10.0, letter: 'N', usNumber: 15 },
  { mm: 12.0, letter: 'O', usNumber: null },
  { mm: 15.0, letter: 'P', usNumber: null },
  { mm: 16.0, letter: 'Q', usNumber: null },
  { mm: 19.0, letter: 'S', usNumber: null },
];

/**
 * Format hook/needle size for display. For crochet, appends the letter (e.g. "5mm (H)").
 * @param {string} hookSize - Stored value e.g. "5mm", "5.0mm", "forgot"
 * @param {string} craftType - "crochet", "knit", or other
 * @returns {string} Formatted display string
 */
export const formatHookSizeForDisplay = (hookSize, craftType) => {
  if (!hookSize) return '';
  if (hookSize.toLowerCase() === 'forgot') return 'Forgot';

  if (craftType === 'crochet') {
    // Parse mm from string like "5mm", "5.0mm", "2.25mm"
    const match = hookSize.match(/^([\d.]+)\s*mm$/i);
    if (match) {
      const mm = parseFloat(match[1]);
      const size = CROCHET_HOOK_SIZES.find(s => Math.abs(s.mm - mm) < 0.01);
      if (size && size.letter) {
        return `${hookSize} (${size.letter})`;
      }
    }
  }

  return hookSize;
};
