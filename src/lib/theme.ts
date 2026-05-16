/**
 * Returns 'dark' between 18:00–06:00 local time, 'light' otherwise.
 */
export function getTimeBasedTheme(): 'dark' | 'light' {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6 ? 'dark' : 'light';
}
