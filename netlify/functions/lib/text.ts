/**
 * Normalize text pasted from Apple Pages, Word, etc. so smart quotes and
 * mojibake (e.g. "â€™" from UTF-8 misinterpreted as Latin-1) become plain ASCII.
 */
export function normalizePastedText(str: string): string {
  if (typeof str !== 'string') return str;
  let s = str;
  // Fix mojibake: UTF-8 bytes for smart quotes read as Windows-1252 (â€™ → ', â€œ → ", â€ → ")
  s = s.replace(/\u00E2\u20AC\u2122/g, "'");   // â€™ (U+2019) → '
  s = s.replace(/\u00E2\u20AC\u0153/g, '"');  // â€œ (U+201C) → "
  s = s.replace(/\u00E2\u20AC\u201D/g, '"');  // â€ (U+201D) → "
  // Unicode smart quotes and apostrophes → ASCII
  s = s.replace(/\u2019/g, "'");  // RIGHT SINGLE QUOTATION MARK
  s = s.replace(/\u2018/g, "'");  // LEFT SINGLE QUOTATION MARK
  s = s.replace(/\u201C/g, '"');  // LEFT DOUBLE QUOTATION MARK
  s = s.replace(/\u201D/g, '"');  // RIGHT DOUBLE QUOTATION MARK
  s = s.replace(/\u2013/g, '-');  // EN DASH
  s = s.replace(/\u2014/g, '-');  // EM DASH
  return s;
}
