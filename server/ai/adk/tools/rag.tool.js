import { FunctionTool } from "@google/adk";
import { retrieveKnowledge } from "../../rag/retrieval/retriever.js";
import { recordRag } from "../../utils/request.tracer.js";
import { getToolSessionState } from "./context.helper.js";

/**
 * ADK FunctionTool wrapper for the existing pgvector RAG pipeline.
 *
 * Preserves the entire RAG implementation:
 * - Gemini embeddings (gemini-embedding-001, 768-dim)
 * - pgvector cosine similarity search
 * - Reranking + deduplication
 * - Threshold: 0.25, topK: 4
 *
 * Uses:
 * 1. FOOD_INFORMATION (food variety, cuisines, specialties, dishes offered)
 * 2. DELIVERY_INFORMATION (delivery areas, delivery fee, minimum order, timings)
 * 3. PAYMENT_INFORMATION (accepted payment methods: cash, card, online)
 * 4. BUSINESS_INFORMATION (restaurant story, identity, overview, contact)
 * 5. RESERVATION_INFORMATION (table reservation policy, advance booking notice)
 *
 * Do NOT use this tool for:
 * - Live/current menu item pricing or stock availability (use database menu tools)
 * - Active deals (use searchDeals)
 * - Orders (use order tools)
 * - Live reservation availability checks or booking (use reservation tools)
 * - Operating hours (use getBusinessHours)
 */
export const adkRagTool = new FunctionTool({
  name: "searchKnowledgeBase",
  description:
    "Search the restaurant knowledge base for unstructured facts: food variety, cuisines, specialties, delivery policies, delivery coverage areas and delivery fees, accepted payment methods, restaurant story, history, identity, and table reservation policy. Use this tool when the customer asks about any of these knowledge topics. Call this tool ONCE with the user's search query. Do NOT use this tool for live menu prices, stock availability, placing orders, checking table availability, or live bookings.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "The customer's question or topic to search for in the knowledge base (e.g., 'food variety', 'delivery fee to Gulberg', 'accepted payment methods', 'reservation policy').",
      },
    },
    required: ["query"],
  },
  execute: async ({ query } = {}, tool_context) => {
    const { businessId, traceId } = getToolSessionState(tool_context);

    if (!query || !query.trim() || !businessId) {
      return {
        success: false,
        query: query || "",
        contextText: "",
        chunks: [],
        chunkCount: 0,
        message: "No relevant restaurant knowledge was found.",
      };
    }

    const cleanQuery = query.trim();

    try {
      const result = await retrieveKnowledge(cleanQuery, businessId, {
        topK: 4,
        threshold: 0.25,
      });

      // Report chunks to request tracer
      if (traceId) {
        recordRag(traceId, {
          query: cleanQuery,
          chunks: result.chunks || [],
          chunkCount: result.chunkCount || 0,
        });
      }

      if (!result.contextText || result.chunkCount === 0) {
        return {
          success: false,
          query: cleanQuery,
          contextText: "",
          chunks: [],
          chunkCount: 0,
          message: "No relevant restaurant knowledge was found.",
        };
      }

      return {
        success: true,
        query: cleanQuery,
        contextText: result.contextText,
        chunks: (result.chunks || []).map((c) => ({
          documentTitle: c.documentTitle,
          documentType: c.documentType,
          content: c.content,
          similarity: c.similarity,
        })),
        chunkCount: result.chunkCount,
      };
    } catch (err) {
      console.error(`[RAG TOOL Error] businessId ${businessId}:`, err.message);
      return {
        success: false,
        query: cleanQuery,
        contextText: "",
        chunks: [],
        chunkCount: 0,
        error: "Knowledge retrieval failed temporarily.",
      };
    }
  },
});
