// ═══════════════════════════════════════════════════════════════════════════
// Fuzzy Document Name Matching — Jaccard Word-Overlap Similarity
// Client-side fuzzy matching for finding similar document titles
// ═══════════════════════════════════════════════════════════════════════════

export interface FuzzyMatch {
  id: string;
  display_name: string;
  author: string;
  doc_summary: string;
  filename: string;
  trust_score: number;
  uploaded_at: Date;
  similarity: number; // 0-1
}

export interface DocSummaryRecord {
  id: string;
  display_name: string;
  author: string;
  doc_summary: string;
  filename: string;
  trust_score: number;
  uploaded_at: Date;
}

/**
 * Tokenize a string into lowercase words, stripping punctuation and stop words.
 */
function tokenize(text: string): Set<string> {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "it", "as", "be", "was", "are",
    "this", "that", "its", "their", "our", "your", "has", "have", "had",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  return new Set(words);
}

/**
 * Compute Jaccard similarity between two sets of tokens.
 * Returns a value between 0 (no overlap) and 1 (identical).
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;

  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Find the top N fuzzy matches for a given display name against a list of existing documents.
 * @param query - The new document's display_name
 * @param existing - All existing document summaries from Firestore
 * @param threshold - Minimum similarity score (default 0.4 = 40%)
 * @param maxResults - Maximum number of matches to return (default 5)
 */
export function findFuzzyMatches(
  query: string,
  existing: DocSummaryRecord[],
  threshold = 0.4,
  maxResults = 5,
): FuzzyMatch[] {
  if (!query || existing.length === 0) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) return [];

  const scored: FuzzyMatch[] = [];

  for (const doc of existing) {
    const docName = doc.display_name || doc.filename;
    const docTokens = tokenize(docName);
    const similarity = jaccardSimilarity(queryTokens, docTokens);

    if (similarity >= threshold) {
      scored.push({
        id: doc.id,
        display_name: doc.display_name,
        author: doc.author,
        doc_summary: doc.doc_summary,
        filename: doc.filename,
        trust_score: doc.trust_score,
        uploaded_at: doc.uploaded_at,
        similarity,
      });
    }
  }

  // Sort by similarity descending, take top N
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, maxResults);
}
