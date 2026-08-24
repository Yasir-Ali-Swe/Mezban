import { GEMINI_API_KEY } from "../../../config/env.js";
import { getEmbeddingModelName } from "./embedding.model.js";

/**
 * Generates vector embeddings for a given text using Gemini Embedding API
 * Forces outputDimensionality: 768 for pgvector compatibility
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== "string" || !text.trim()) {
    throw new Error("Text is required for generating embeddings");
  }

  const model = getEmbeddingModelName();
  const apiKey = GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in env configuration");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${model}`,
      outputDimensionality: 768,
      content: {
        parts: [{ text: text.trim() }],
      },
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.embedding?.values) {
    console.error("Gemini Embedding API Error:", data);
    throw new Error(data.error?.message || "Failed to generate embedding vector from Gemini");
  }

  return data.embedding.values;
}

/**
 * Generates embeddings for a batch of texts
 */
export async function generateBatchEmbeddings(texts) {
  const vectors = [];
  for (const text of texts) {
    const vector = await generateEmbedding(text);
    vectors.push(vector);
  }
  return vectors;
}
