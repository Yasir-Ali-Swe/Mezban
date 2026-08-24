/**
 * Semantic-aware chunking strategy for business documents.
 * Splitting prefers paragraph and sentence boundaries.
 */
export function chunkText(text, options = {}) {
  const { maxChunkSize = 800, minChunkSize = 50, overlap = 100 } = options;

  if (!text || typeof text !== "string") return [];

  const cleanText = text.trim();
  if (cleanText.length <= maxChunkSize) {
    return [cleanText];
  }

  // Split into paragraphs
  const paragraphs = cleanText.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk + "\n" + para).length <= maxChunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n${para}` : para;
    } else {
      if (currentChunk.length >= minChunkSize) {
        chunks.push(currentChunk.trim());
      }

      // Handle long paragraphs by splitting at sentence boundaries
      if (para.length > maxChunkSize) {
        const sentences = para.match(/[^.!?]+[.!?]+(\s|$)/g) || [para];
        let sentenceChunk = "";

        for (const sentence of sentences) {
          if ((sentenceChunk + " " + sentence).length <= maxChunkSize) {
            sentenceChunk = sentenceChunk ? `${sentenceChunk} ${sentence}` : sentence;
          } else {
            if (sentenceChunk.length >= minChunkSize) {
              chunks.push(sentenceChunk.trim());
            }
            sentenceChunk = sentence;
          }
        }

        if (sentenceChunk.trim()) {
          currentChunk = sentenceChunk.trim();
        } else {
          currentChunk = "";
        }
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk.trim() && currentChunk.length >= minChunkSize) {
    chunks.push(currentChunk.trim());
  }

  // Fallback if text couldn't be split logically
  if (chunks.length === 0 && cleanText.length > 0) {
    chunks.push(cleanText);
  }

  return chunks;
}
