// Maps language codes to OCR layout profiles.
// Routing is by layout physics only, not language meaning.
export const OCR_PROFILES: Record<string, string> = {
  zh: "vertical_cjk",
  ja: "vertical_cjk",
  ko: "vertical_cjk",

  ar: "rtl_horizontal",
  fa: "rtl_horizontal",
  ur: "rtl_horizontal",

  en: "ltr_horizontal",
  fr: "ltr_horizontal",
  de: "ltr_horizontal",
  it: "ltr_horizontal",
  es: "ltr_horizontal",
  la: "ltr_horizontal",
  pt: "ltr_horizontal",
  he: "ltr_horizontal", // Hebrew is RTL but handled as LTR fallback for now
  el: "ltr_horizontal",
};

const PROMPTS: Record<string, string> = {
  ltr_horizontal: `You are an OCR transcription system.

Transcribe all visible text exactly.

LAYOUT:
- Horizontal text.
- Read LEFT to RIGHT, TOP to BOTTOM.

RULES:
- Preserve line breaks.
- Do not repeat text.
- Do not interpret or translate.
- Stop after the final line.

Output transcription only.`,

  rtl_horizontal: `You are an OCR transcription system.

Transcribe all visible text exactly.

LAYOUT:
- Horizontal right-to-left script.
- Read RIGHT to LEFT.
- Lines proceed TOP to BOTTOM.

RULES:
- Preserve diacritics if visible.
- Do not reverse word order.
- Do not repeat text.
- Stop after final line.

Output transcription only.`,

  vertical_cjk: `You are an OCR transcription system.

LAYOUT:
- Vertical columns.
- Columns read RIGHT to LEFT.
- Characters read TOP to BOTTOM.

RULES:
- One column per line.
- Never repeat text.
- Stop after last column.

Output transcription only.`,
};

export interface DecodingParams {
  temperature: number;
  repetition_penalty: number;
  frequency_penalty: number;
}

const DECODING_PARAMS: Record<string, DecodingParams> = {
  ltr_horizontal: {
    temperature: 0,
    repetition_penalty: 1.1,
    frequency_penalty: 0,
  },
  rtl_horizontal: {
    temperature: 0,
    repetition_penalty: 1.25,
    frequency_penalty: 0.4,
  },
  vertical_cjk: {
    temperature: 0,
    repetition_penalty: 1.3,
    frequency_penalty: 0.6,
  },
};

/** Convert a full language name (e.g. "Arabic") to a 2-letter ISO code. */
function normalizeLangCode(lang: string): string | null {
  const l = lang.toLowerCase();
  if (l.includes("chinese")) return "zh";
  if (l.includes("japanese")) return "ja";
  if (l.includes("korean")) return "ko";
  if (l.includes("arabic")) return "ar";
  if (l.includes("persian") || l.includes("farsi")) return "fa";
  if (l.includes("urdu")) return "ur";
  if (l.includes("latin")) return "la";
  if (l.includes("greek")) return "el";
  if (l.includes("hebrew")) return "he";
  if (l.includes("german")) return "de";
  if (l.includes("french")) return "fr";
  if (l.includes("spanish")) return "es";
  if (l.includes("italian")) return "it";
  if (l.includes("portuguese")) return "pt";
  if (l.includes("english")) return "en";
  return null;
}

/** Derive a 2-letter code from a book's language[] array. Returns "en" as fallback. */
export function bookLangToCode(languages: string[]): string {
  for (const lang of languages) {
    const code = normalizeLangCode(lang);
    if (code) return code;
  }
  return "en";
}

export function getOcrProfile(langCode: string): string {
  return OCR_PROFILES[langCode] ?? "ltr_horizontal";
}

export function getPrompt(langCode: string): string {
  const profile = getOcrProfile(langCode);
  return PROMPTS[profile];
}

export function getDecodingParams(langCode: string): DecodingParams {
  const profile = getOcrProfile(langCode);
  return DECODING_PARAMS[profile];
}
