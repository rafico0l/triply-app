/**
 * Format Bangladesh mobile numbers for display.
 *
 * Normalizes various input formats to: +880 XXXX-XXXXXX
 *
 * Does not mutate the original value.
 */
export function formatBdMobileForDisplay(mobile: string | undefined | null): string {
  if (!mobile) return "";

  const cleaned = mobile.replace(/\D/g, "");

  if (cleaned.length === 10 && cleaned.startsWith("1")) {
    return `+880 ${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith("01")) {
    const withoutLeadingZero = cleaned.slice(1);
    return `+880 ${withoutLeadingZero.slice(0, 4)}-${withoutLeadingZero.slice(4)}`;
  }

  if (cleaned.length === 13 && cleaned.startsWith("880")) {
    const national = cleaned.slice(3);
    return `+880 ${national.slice(0, 4)}-${national.slice(4)}`;
  }

  return mobile;
}