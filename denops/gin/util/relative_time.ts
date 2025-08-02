/**
 * Returns a human-readable relative time string.
 */
export function relativeTime(time: Date, base?: Date): string {
  const now = base || new Date();
  const diffMs = now.getTime() - time.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isFuture = diffMs < 0;

  // Time thresholds in milliseconds
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY; // Approximate
  const YEAR = 365 * DAY; // Approximate

  // Helper function to format the result
  const format = (value: number, unit: string): string => {
    const plural = value !== 1 ? "s" : "";
    if (isFuture) {
      return `in ${value} ${unit}${plural}`;
    }
    return `${value} ${unit}${plural} ago`;
  };

  // Calculate relative time
  if (absDiffMs < MINUTE) {
    return "just now";
  } else if (absDiffMs < HOUR) {
    const minutes = Math.floor(absDiffMs / MINUTE);
    return format(minutes, "minute");
  } else if (absDiffMs < DAY) {
    const hours = Math.floor(absDiffMs / HOUR);
    return format(hours, "hour");
  } else if (absDiffMs < WEEK) {
    const days = Math.floor(absDiffMs / DAY);
    return format(days, "day");
  } else if (absDiffMs < MONTH) {
    const weeks = Math.floor(absDiffMs / WEEK);
    return format(weeks, "week");
  } else if (absDiffMs < YEAR) {
    // For months, we need more accurate calculation
    const months = calculateMonthsDifference(time, now, isFuture);
    return format(months, "month");
  } else {
    // For years, we need more accurate calculation
    const years = calculateYearsDifference(time, now, isFuture);
    return format(years, "year");
  }
}

/**
 * Calculate the difference in months between two dates
 */
function calculateMonthsDifference(
  date1: Date,
  date2: Date,
  isFuture: boolean,
): number {
  const [earlier, later] = isFuture ? [date2, date1] : [date1, date2];
  let months = (later.getFullYear() - earlier.getFullYear()) * 12;
  months += later.getMonth() - earlier.getMonth();

  // Adjust if the day of month hasn't been reached yet
  if (later.getDate() < earlier.getDate()) {
    months--;
  }

  return Math.max(1, months);
}

/**
 * Calculate the difference in years between two dates
 */
function calculateYearsDifference(
  date1: Date,
  date2: Date,
  isFuture: boolean,
): number {
  const [earlier, later] = isFuture ? [date2, date1] : [date1, date2];
  let years = later.getFullYear() - earlier.getFullYear();

  // Adjust if the anniversary hasn't been reached yet
  if (
    later.getMonth() < earlier.getMonth() ||
    (later.getMonth() === earlier.getMonth() &&
      later.getDate() < earlier.getDate())
  ) {
    years--;
  }

  return Math.max(1, years);
}
