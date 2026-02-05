/**
 * Normalize text pasted from Apple Pages, Word, etc. so smart quotes and
 * mojibake (e.g. "â€™" from UTF-8 misinterpreted as Latin-1) display as plain ASCII.
 * Use when displaying captions, tips, or other user text that may have been pasted.
 */
export function normalizePastedText(str: string): string {
  if (typeof str !== 'string') return str;
  let s = str;
  // Fix mojibake: UTF-8 bytes for smart quotes read as Windows-1252
  s = s.replace(/\u00E2\u20AC\u2122/g, "'");   // â€™ → '
  s = s.replace(/\u00E2\u20AC\u0153/g, '"');  // â€œ → "
  s = s.replace(/\u00E2\u20AC\u201D/g, '"');  // â€ → "
  // Unicode smart quotes and apostrophes → ASCII
  s = s.replace(/\u2019/g, "'");
  s = s.replace(/\u2018/g, "'");
  s = s.replace(/\u201C/g, '"');
  s = s.replace(/\u201D/g, '"');
  s = s.replace(/\u2013/g, '-');
  s = s.replace(/\u2014/g, '-');
  return s;
}
