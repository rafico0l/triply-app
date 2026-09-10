/**
 * Get time-of-day greeting based on local device hour (0-23).
 */
export function getGreetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }
  if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}

/**
 * Get current greeting using local device time.
 */
export function getCurrentGreeting(): string {
  const hour = new Date().getHours();
  return getGreetingForHour(hour);
}