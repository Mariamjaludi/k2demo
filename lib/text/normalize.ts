/** Strip Arabic tashkeel (diacritics) and tatweel (kashida) */
const TASHKEEL_AND_TATWEEL = /[\u0610-\u061A\u0640\u064B-\u065F\u0670]/g;

/** Common punctuation in both Latin and Arabic */
const PUNCTUATION = /[؟،؛.,:;!?'"()\[\]{}\-_]/g;

/**
 * Normalize text for matching: lowercase, NFKC, strip Arabic diacritics,
 * replace punctuation with spaces, collapse whitespace.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(TASHKEEL_AND_TATWEEL, "")
    .replace(PUNCTUATION, " ")
    .replace(/\s+/g, " ")
    .trim();
}
