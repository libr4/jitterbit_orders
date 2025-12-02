/**
 * Parse time duration string into milliseconds.
 * Supports: numeric (ms), '1h', '30m', '3600s', etc.
 * @returns milliseconds, or undefined if parsing fails
 */
export const parseExpiresToMs = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const v = value.trim();
  if (/^\d+$/.test(v)) return Number(v);
  if (v.endsWith('ms')) return Number(v.replace(/ms$/, ''));
  if (v.endsWith('s')) return Number(v.replace(/s$/, '')) * 1000;
  if (v.endsWith('m')) return Number(v.replace(/m$/, '')) * 60 * 1000;
  if (v.endsWith('h')) return Number(v.replace(/h$/, '')) * 60 * 60 * 1000;
  return undefined;
};
