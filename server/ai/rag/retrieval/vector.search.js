import prisma from "../../../config/prisma.js";

/**
 * Perform pgvector cosine similarity search strictly scoped by businessId
 * @param {Array<number>} queryEmbedding - 768-dimensional float array
 * @param {string} businessId - Target business ID for tenant isolation
 * @param {number} limit - Top K results to return
 * @param {number} threshold - Minimum similarity threshold (e.g., 0.3)
 */
export async function searchVectorDatabase(queryEmbedding, businessId, limit = 5, threshold = 0.25) {
  if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    return [];
  }

  if (!businessId) {
    throw new Error("Tenant Security Exception: businessId is strictly required for RAG search");
  }

  const vectorString = `[${queryEmbedding.join(",")}]`;

  try {
    // Cosine similarity in pgvector: 1 - (embedding <=> queryVector)
    const results = await prisma.$queryRawUnsafe(
      `
      SELECT 
        kc.id,
        kc."businessId",
        kc."documentId",
        kc.content,
        kc."chunkIndex",
        kc.metadata,
        kd.title as "documentTitle",
        kd.type as "documentType",
        1 - (kc.embedding <=> $1::vector) as similarity
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeDocument" kd ON kc."documentId" = kd.id
      WHERE kc."businessId" = $2
        AND kc.embedding IS NOT NULL
        AND (1 - (kc.embedding <=> $1::vector)) >= $3
      ORDER BY kc.embedding <=> $1::vector ASC
      LIMIT $4;
      `,
      vectorString,
      businessId,
      threshold,
      limit
    );

    return results.map((r) => ({
      id: r.id,
      businessId: r.businessId,
      documentId: r.documentId,
      content: r.content,
      chunkIndex: r.chunkIndex,
      documentTitle: r.documentTitle,
      documentType: r.documentType,
      similarity: Number(r.similarity),
    }));
  } catch (error) {
    console.error(`[Vector Search Error] Failed vector search for business ${businessId}:`, error.message);
    return [];
  }
}
