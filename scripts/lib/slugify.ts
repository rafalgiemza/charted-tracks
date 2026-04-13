/**
 * Zamienia dowolny string na URL-friendly slug.
 * Obsługuje znaki specjalne, akcentowane litery i interpunkcję.
 *
 * Przykłady:
 *   "As It Was"            → "as-it-was"
 *   "Escapism."            → "escapism"
 *   "RAYE ft. 070 Shake"   → "raye-ft-070-shake"
 *   "Ella Baila Sola"      → "ella-baila-sola"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")                      // rozłącz znaki akcentowane (é → e + ´)
    .replace(/[\u0300-\u036f]/g, "")       // usuń znaki diakrytyczne
    .replace(/[^a-z0-9\s-]/g, "")         // zostaw tylko litery, cyfry, spacje, myślniki
    .trim()
    .replace(/\s+/g, "-")                  // spacje → myślniki
    .replace(/-+/g, "-");                  // wiele myślników → jeden
}
