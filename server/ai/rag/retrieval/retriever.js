import { generateEmbedding } from "../embeddings/embedding.provider.js";
import { searchVectorDatabase } from "./vector.search.js";
import { rerankChunks } from "./reranker.js";

/**
 * Retrieves relevant knowledge chunks for a user query scoped by businessId
 */
export async function retrieveKnowledge(query, businessId, options = {}) {
  const { topK = 5, threshold = 0.25, maxChunks = 4 } = options;

  if (!query || !query.trim() || !businessId) {
    return {
      chunks: [],
      contextText: "",
      chunkCount: 0,
      primaryDocumentType: null,
      embeddingTimeMs: 0,
      vectorSearchTimeMs: 0,
    };
  }

  try {
    // 1. Generate embedding for query
    const t0 = Date.now();
    const queryVector = await generateEmbedding(query);
    const embeddingTimeMs = Date.now() - t0;

    // 2. Search pgvector database scoped by businessId
    const t1 = Date.now();
    const rawChunks = await searchVectorDatabase(queryVector, businessId, topK, threshold);
    const vectorSearchTimeMs = Date.now() - t1;

    // 3. Rerank and deduplicate
    const finalChunks = rerankChunks(rawChunks, maxChunks);

    // 4. Assemble context string and primary document type
    const contextText = finalChunks
      .map((c, i) => `[Knowledge Source ${i + 1}: ${c.documentTitle}]\n${c.content}`)
      .join("\n\n");

    const primaryDocumentType = finalChunks.length > 0 ? finalChunks[0].documentType : null;

    return {
      chunks: finalChunks,
      contextText,
      chunkCount: finalChunks.length,
      primaryDocumentType,
      embeddingTimeMs,
      vectorSearchTimeMs,
    };
  } catch (error) {
    console.error(`[RAG Retrieval Error] Business ${businessId}:`, error.message);
    return {
      chunks: [],
      contextText: "",
      chunkCount: 0,
      primaryDocumentType: null,
      embeddingTimeMs: 0,
      vectorSearchTimeMs: 0,
      error: error.message,
    };
  }
}
