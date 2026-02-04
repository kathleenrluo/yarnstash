/**
 * Material Parser Utility
 * 
 * Parses material breakdown strings into structured entries for form handling.
 */

/**
 * Parse a material breakdown string (e.g., "80% merino, 20% nylon") into structured entries.
 * 
 * @param {string} breakdown - The material breakdown string
 * @param {Array} options - Array of material options with {value, label} structure
 * @returns {Object} Object with {entries, searchInputs} where entries is [{material, percent}]
 */
export const parseMaterialBreakdown = (breakdown, options = []) => {
  if (!breakdown || !breakdown.trim()) {
    return { entries: [], searchInputs: [] };
  }
  
  // Pattern: "80% merino, 20% nylon" or "80% merino 20% nylon"
  const entries = [];
  const searchInputs = [];
  
  // Split by comma first, then handle space-separated
  const parts = breakdown.split(',').map(p => p.trim()).filter(p => p);
  
  for (const part of parts) {
    // Match "XX% material" pattern
    const match = part.match(/^(\d+)%\s*(.+)$/);
    if (match) {
      const percent = match[1];
      const material = match[2].trim();
      entries.push({ material, percent });
      // Find label for material
      const materialOption = options.find(opt => opt.value === material);
      searchInputs.push(materialOption ? materialOption.label : material);
    }
  }
  
  return { entries, searchInputs };
};
