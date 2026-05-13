// Formatting helpers for growing-space dimensions.
//
// All dimensions are stored as `numeric` inches in Postgres. When a
// user enters feet in the UI, we convert at save time, which leaves
// values like 44.76" (3.73 ft × 12). For display we pick a friendlier
// unit and round.

/**
 * Format `width_inches × length_inches` for human display.
 *
 * Rule: if either side is at least 24 inches, render in feet with up
 * to one decimal (trailing .0 stripped). Otherwise render in inches,
 * rounded to the nearest whole inch.
 */
export function formatSpaceDimensions(
  widthInches: number,
  lengthInches: number,
): string {
  const max = Math.max(widthInches, lengthInches);
  if (max >= 24) {
    return `${toFeet(widthInches)}′ × ${toFeet(lengthInches)}′`;
  }
  return `${Math.round(widthInches)}″ × ${Math.round(lengthInches)}″`;
}

function toFeet(inches: number): string {
  const feet = inches / 12;
  // One decimal, but drop a trailing .0 so 36" → "3" not "3.0".
  const rounded = feet.toFixed(1);
  return rounded.endsWith(".0") ? rounded.slice(0, -2) : rounded;
}
