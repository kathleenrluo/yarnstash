/**
 * Date Parser Utility
 * 
 * Parses flexible date formats for sorting:
 * - Full date: "2024-03-15" or "2024/03/15"
 * - Month and year: "2024-03", "03-2024", "March 2024", "Mar 2024"
 * - Year only: "2024"
 * 
 * Returns a sortable value where less specific dates appear at the end of their time range.
 * For example: "10 Jan 2024" comes before "Jan 2024", which comes before "2024".
 */

const MONTH_NAMES = {
  'january': 1, 'jan': 1,
  'february': 2, 'feb': 2,
  'march': 3, 'mar': 3,
  'april': 4, 'apr': 4,
  'may': 5,
  'june': 6, 'jun': 6,
  'july': 7, 'jul': 7,
  'august': 8, 'aug': 8,
  'september': 9, 'sep': 9, 'sept': 9,
  'october': 10, 'oct': 10,
  'november': 11, 'nov': 11,
  'december': 12, 'dec': 12,
};

const MONTH_DISPLAY_NAMES = [
  '', // 0-indexed, so index 0 is unused
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Parse a date string into a sortable value.
 * 
 * Returns an object with:
 * - sortValue: A number for sorting (higher = more recent)
 * - specificity: 3 = full date, 2 = month+year, 1 = year only, 0 = invalid/null
 * 
 * Less specific dates appear at the end of their time range:
 * - Full dates: year * 10000 + month * 100 + day
 * - Month+year: year * 10000 + month * 100 + 32 (day 32 sorts after all valid days)
 * - Year only: year * 10000 (handled specially in comparison)
 */
export function parseDateForSorting(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return { sortValue: 0, specificity: 0 };
  }

  const trimmed = dateString.trim();
  if (!trimmed) {
    return { sortValue: 0, specificity: 0 };
  }

  // Try full date format: YYYY-MM-DD or YYYY/MM/DD
  const fullDateMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (fullDateMatch) {
    const year = parseInt(fullDateMatch[1], 10);
    const month = parseInt(fullDateMatch[2], 10);
    const day = parseInt(fullDateMatch[3], 10);
    // Sort value: year * 10000 + month * 100 + day
    // This ensures full dates sort in chronological order
    const sortValue = year * 10000 + month * 100 + day;
    return { sortValue, specificity: 3 };
  }

  // Try day-month-year format: DD-MM-YYYY, DD/MM/YYYY, DD Month YYYY, DD Mon YYYY
  const dayMonthYearMatch1 = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/); // DD-MM-YYYY or DD/MM/YYYY
  if (dayMonthYearMatch1) {
    const day = parseInt(dayMonthYearMatch1[1], 10);
    const month = parseInt(dayMonthYearMatch1[2], 10);
    const year = parseInt(dayMonthYearMatch1[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const sortValue = year * 10000 + month * 100 + day;
      return { sortValue, specificity: 3 };
    }
  }

  // Try text day-month-year format: "13 March 2024", "13 Mar 2024", etc.
  const textDayMonthYearMatch = trimmed.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i);
  if (textDayMonthYearMatch) {
    const day = parseInt(textDayMonthYearMatch[1], 10);
    const monthName = textDayMonthYearMatch[2].toLowerCase();
    const year = parseInt(textDayMonthYearMatch[3], 10);
    const month = MONTH_NAMES[monthName];
    if (month && day >= 1 && day <= 31) {
      const sortValue = year * 10000 + month * 100 + day;
      return { sortValue, specificity: 3 };
    }
  }

  // Try month-year formats: YYYY-MM, MM-YYYY, "Month YYYY", "Mon YYYY"
  const monthYearMatch1 = trimmed.match(/^(\d{4})[-/](\d{1,2})$/); // YYYY-MM or YYYY/MM
  if (monthYearMatch1) {
    const year = parseInt(monthYearMatch1[1], 10);
    const month = parseInt(monthYearMatch1[2], 10);
    if (month >= 1 && month <= 12) {
      // Day 32 doesn't exist, so this sorts after all valid days (1-31) in that month
      const sortValue = year * 10000 + month * 100 + 32;
      return { sortValue, specificity: 2 };
    }
  }

  const monthYearMatch2 = trimmed.match(/^(\d{1,2})[-/](\d{4})$/); // MM-YYYY or MM/YYYY
  if (monthYearMatch2) {
    const month = parseInt(monthYearMatch2[1], 10);
    const year = parseInt(monthYearMatch2[2], 10);
    if (month >= 1 && month <= 12) {
      const sortValue = year * 10000 + month * 100 + 32;
      return { sortValue, specificity: 2 };
    }
  }

  // Try text month format: "March 2024", "Mar 2024", etc.
  const textMonthMatch = trimmed.match(/^([a-z]+)\s+(\d{4})$/i);
  if (textMonthMatch) {
    const monthName = textMonthMatch[1].toLowerCase();
    const year = parseInt(textMonthMatch[2], 10);
    const month = MONTH_NAMES[monthName];
    if (month) {
      const sortValue = year * 10000 + month * 100 + 32;
      return { sortValue, specificity: 2 };
    }
  }

  // Try year only: YYYY
  const yearMatch = trimmed.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    // Handled specially in comparison to ensure year-only comes after all dates in that year
    const sortValue = year * 10000;
    return { sortValue, specificity: 1 };
  }

  // Invalid format - treat as null
  return { sortValue: 0, specificity: 0 };
}

/**
 * Compare two date strings for sorting.
 * 
 * Less specific dates appear at the end of their time range.
 * Returns: negative if a < b, positive if a > b, 0 if equal
 */
export function compareDates(a, b) {
  const parsedA = parseDateForSorting(a);
  const parsedB = parseDateForSorting(b);

  // If both are invalid/null, they're equal
  if (parsedA.specificity === 0 && parsedB.specificity === 0) {
    return 0;
  }

  // Invalid dates sort last
  if (parsedA.specificity === 0) return 1;
  if (parsedB.specificity === 0) return -1;

  if (parsedA.sortValue !== parsedB.sortValue) {
    return parsedB.sortValue - parsedA.sortValue;
  }

  // Same date, different specificity - more specific comes first
  return parsedB.specificity - parsedA.specificity;
}

/**
 * Format a date string for consistent display.
 * 
 * Converts various input formats to a consistent display format:
 * - Full date (2024-03-15, 13 March 2024) -> "March 15, 2024"
 * - Month+year (2024-03, 03-2024, March 2024) -> "March 2024"
 * - Year only (2024) -> "2024"
 * 
 * If the date cannot be parsed, returns the original string.
 * If the date is null/empty, returns "Unknown".
 */
export function formatDateForDisplay(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return 'Unknown';
  }

  const trimmed = dateString.trim();
  if (!trimmed) {
    return 'Unknown';
  }

  // Try full date format: YYYY-MM-DD or YYYY/MM/DD
  const fullDateMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (fullDateMatch) {
    const year = parseInt(fullDateMatch[1], 10);
    const month = parseInt(fullDateMatch[2], 10);
    const day = parseInt(fullDateMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${MONTH_DISPLAY_NAMES[month]} ${day}, ${year}`;
    }
  }

  // Try day-month-year format: DD-MM-YYYY or DD/MM/YYYY
  const dayMonthYearMatch1 = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dayMonthYearMatch1) {
    const day = parseInt(dayMonthYearMatch1[1], 10);
    const month = parseInt(dayMonthYearMatch1[2], 10);
    const year = parseInt(dayMonthYearMatch1[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${MONTH_DISPLAY_NAMES[month]} ${day}, ${year}`;
    }
  }

  // Try text day-month-year format: "13 March 2024", "13 Mar 2024", etc.
  const textDayMonthYearMatch = trimmed.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i);
  if (textDayMonthYearMatch) {
    const day = parseInt(textDayMonthYearMatch[1], 10);
    const monthName = textDayMonthYearMatch[2].toLowerCase();
    const year = parseInt(textDayMonthYearMatch[3], 10);
    const month = MONTH_NAMES[monthName];
    if (month && day >= 1 && day <= 31) {
      return `${MONTH_DISPLAY_NAMES[month]} ${day}, ${year}`;
    }
  }

  // Try month-year formats: YYYY-MM or YYYY/MM
  const monthYearMatch1 = trimmed.match(/^(\d{4})[-/](\d{1,2})$/);
  if (monthYearMatch1) {
    const year = parseInt(monthYearMatch1[1], 10);
    const month = parseInt(monthYearMatch1[2], 10);
    if (month >= 1 && month <= 12) {
      return `${MONTH_DISPLAY_NAMES[month]} ${year}`;
    }
  }

  // Try month-year formats: MM-YYYY or MM/YYYY
  const monthYearMatch2 = trimmed.match(/^(\d{1,2})[-/](\d{4})$/);
  if (monthYearMatch2) {
    const month = parseInt(monthYearMatch2[1], 10);
    const year = parseInt(monthYearMatch2[2], 10);
    if (month >= 1 && month <= 12) {
      return `${MONTH_DISPLAY_NAMES[month]} ${year}`;
    }
  }

  // Try text month format: "March 2024", "Mar 2024", etc.
  const textMonthMatch = trimmed.match(/^([a-z]+)\s+(\d{4})$/i);
  if (textMonthMatch) {
    const monthName = textMonthMatch[1].toLowerCase();
    const year = parseInt(textMonthMatch[2], 10);
    const month = MONTH_NAMES[monthName];
    if (month) {
      return `${MONTH_DISPLAY_NAMES[month]} ${year}`;
    }
  }

  // Try year only: YYYY
  const yearMatch = trimmed.match(/^(\d{4})$/);
  if (yearMatch) {
    return trimmed; // Just return the year as-is
  }

  // If we can't parse it, return the original string
  return trimmed;
}
