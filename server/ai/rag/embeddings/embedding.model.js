import { EMBEDDING_MODEL } from "../../../config/env.js";

export const getEmbeddingModelName = () => {
  return EMBEDDING_MODEL || "gemini-embedding-001";
};
