/**
 * Reranks and deduplicates retrieved knowledge chunks
 */
export function rerankChunks(chunks, maxChunks = 4) {
  if (!chunks || chunks.length === 0) return [];

  // Sort by similarity score descending
  const sorted = [...chunks].sort((a, b) => b.similarity - a.similarity);

  // Deduplicate chunks with identical or near-identical content
  const unique = [];
  const seenContent = new Set();

  for (const chunk of sorted) {
    const key = chunk.content.trim().toLowerCase();
    if (!seenContent.has(key)) {
      seenContent.add(key);
      unique.push(chunk);
    }
    if (unique.length >= maxChunks) break;
  }

  return unique;
}
