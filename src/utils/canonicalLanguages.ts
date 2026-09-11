/**
 * Presentation-level language facets.
 *
 * Source catalogues use their own vocabularies (and sometimes place more than
 * one language in one string).  Keep those source values on BookRecord for
 * provenance, but use these canonical values for aggregate counts and filters.
 */
export const LANGUAGE_UNSPECIFIED = 'Language unspecified'

const UNSPECIFIED_VALUES = new Set([
  'not identified',
  'language not recorded',
])

const LANGUAGE_RULES: ReadonlyArray<readonly [string, RegExp]> = [
  ['Anglo-Norman', /anglo-norman/],
  ['Arabic', /\barab(?:ic|e)\b/],
  ['Aramaic', /aramaic/],
  ['Armenian', /armenian/],
  ['Chaghatay', /chaghatay/],
  ['Chinese', /\b(?:chinese|chinois)\b/],
  ['Church Slavonic', /church slavonic/],
  ['Coptic', /copte/],
  ['Dutch', /dutch/],
  ['English', /\b(?:english|anglais)\b/],
  ['French', /\b(?:french|français)\b/],
  ['Ge’ez', /guèze/],
  ['German', /\b(?:german|allemand)\b/],
  ['Greek', /\b(?:greek|grec)\b/],
  ['Hebrew', /hebrew/],
  ['Hungarian', /hungarian/],
  ['Italian', /\b(?:italian|italien)\b/],
  ['Japanese', /japanese/],
  ['Korean', /korean/],
  ['Latin', /latin/],
  ['Nahuatl', /nahuatl/],
  ['Occitan', /occitan/],
  ['Pali', /pali/],
  ['Persian', /persian/],
  ['Russian', /russian/],
  ['Sanskrit', /sanskrit/],
  ['Spanish', /spanish/],
  ['Swedish', /swedish/],
  ['Syriac', /syriaque/],
  ['Turkish / Ottoman Turkish', /turkish|turc/],
  ['Welsh', /welsh/],
]

function normalise(value: string) {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase()
}

/** Returns one canonical facet per language represented by a book. */
export function canonicalLanguages(rawLanguages: string[]): string[] {
  const raw = rawLanguages.map(normalise).filter(Boolean)
  const canonical = new Set<string>()

  raw.forEach((value) => {
    LANGUAGE_RULES.forEach(([language, pattern]) => {
      if (pattern.test(value)) canonical.add(language)
    })
  })

  return [...canonical]
}

/** A missing or explicitly unrecorded source value, distinct from a language. */
export function hasUnspecifiedLanguage(rawLanguages: string[]): boolean {
  const raw = rawLanguages.map(normalise).filter(Boolean)
  return raw.length === 0 || raw.every((value) => UNSPECIFIED_VALUES.has(value))
}

export function hasNoLinguisticContent(rawLanguages: string[]): boolean {
  return rawLanguages.map(normalise).some((value) => value === 'no linguistic content')
}
