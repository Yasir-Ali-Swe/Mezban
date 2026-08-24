import { indexBusinessKnowledge } from "./indexer.js";

const pendingIndexSet = new Set();

/**
 * Enqueues a businessId for background reindexing with optional target document type
 */
export function enqueueReindex(businessId, targetType = null) {
  if (!businessId) return;

  const key = `${businessId}:${targetType || "ALL"}`;

  if (pendingIndexSet.has(key)) {
    return;
  }

  pendingIndexSet.add(key);

  setImmediate(async () => {
    try {
      await indexBusinessKnowledge(businessId, targetType);
    } catch (err) {
      console.error(`[Index Queue Error] Background index failed for business ${businessId}:`, err.message);
    } finally {
      pendingIndexSet.delete(key);
    }
  });
}
