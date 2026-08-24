import prisma from "../../../config/prisma.js";
import { buildKnowledgeDocuments } from "../documents/document.builder.js";
import { chunkText } from "../chunking/chunker.js";
import { generateEmbedding } from "../embeddings/embedding.provider.js";

/**
 * Indexes or reindexes RAG knowledge documents and pgvector chunks for a businessId.
 * @param {string} businessId
 * @param {string|null} targetType Optional document type filter (e.g. "DELIVERY", "FOOD", "PAYMENT", "BUSINESS", "HOURS")
 */
export async function indexBusinessKnowledge(businessId, targetType = null) {
  if (!businessId) {
    throw new Error("indexBusinessKnowledge requires businessId");
  }

  console.log(`\n==================================================`);
  console.log(`[RAG Indexer] Starting indexing for Business: ${businessId}${targetType ? ` (Document Type: ${targetType})` : ""}`);
  console.log(`==================================================`);

  const startTime = Date.now();

  try {
    // 1. Build KnowledgeDocuments from Business models
    let docsToBuild = await buildKnowledgeDocuments(businessId);

    if (targetType) {
      docsToBuild = docsToBuild.filter((d) => d.type === targetType);

      // Delete only existing RAG documents and chunks for this document type
      const targetDocs = await prisma.knowledgeDocument.findMany({
        where: { businessId, type: targetType },
        select: { id: true },
      });
      const targetDocIds = targetDocs.map((d) => d.id);

      if (targetDocIds.length > 0) {
        await prisma.knowledgeChunk.deleteMany({
          where: { documentId: { in: targetDocIds } },
        });
        await prisma.knowledgeDocument.deleteMany({
          where: { id: { in: targetDocIds } },
        });
      }
    } else {
      // Delete all existing RAG documents and chunks for this businessId
      await prisma.knowledgeChunk.deleteMany({
        where: { businessId },
      });
      await prisma.knowledgeDocument.deleteMany({
        where: { businessId },
      });
    }

    let totalChunksIndexed = 0;

    // 2. Process each document
    for (const docData of docsToBuild) {
      if (!docData.content || !docData.content.trim()) continue;

      // Save KnowledgeDocument
      const createdDoc = await prisma.knowledgeDocument.create({
        data: {
          businessId,
          type: docData.type,
          title: docData.title,
          content: docData.content,
          sourceType: docData.sourceType,
          sourceId: docData.sourceId,
        },
      });

      // Split content into chunks
      const chunks = chunkText(docData.content);

      for (let i = 0; i < chunks.length; i++) {
        const chunkTextContent = chunks[i];

        // Create chunk in DB
        const createdChunk = await prisma.knowledgeChunk.create({
          data: {
            businessId,
            documentId: createdDoc.id,
            content: chunkTextContent,
            chunkIndex: i,
          },
        });

        // Generate vector embedding
        try {
          const vector = await generateEmbedding(chunkTextContent);
          const vectorString = `[${vector.join(",")}]`;

          // Update vector column via raw SQL
          await prisma.$executeRawUnsafe(
            `UPDATE "KnowledgeChunk" SET embedding = $1::vector WHERE id = $2;`,
            vectorString,
            createdChunk.id
          );
          totalChunksIndexed++;
        } catch (embedErr) {
          console.warn(`[RAG Indexer Warning] Embedding failed for chunk ${createdChunk.id}:`, embedErr.message);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [RAG Indexer] Indexed ${docsToBuild.length} documents (${totalChunksIndexed} vector chunks) in ${duration}ms`);
    console.log(`==================================================\n`);

    return {
      success: true,
      documentsCount: docsToBuild.length,
      chunksCount: totalChunksIndexed,
      durationMs: duration,
    };
  } catch (error) {
    console.error(`❌ [RAG Indexer Error] Failed indexing business ${businessId}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}
