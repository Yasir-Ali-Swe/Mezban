/**
 * Structured terminal diagnostic logger for TeleAgent AI Requests
 */
export const logAiDiagnostic = ({
  userQuery,
  intent,
  selectedAgent,
  capability,
  ragUsed = false,
  ragDocument = null,
  retrievedChunksCount = 0,
  toolName = "none",
  toolInput = null,
  toolResult = null,
  finalResponse,
  executionTimeMs = 0,
  timings = null,
  telegramSendTimeMs = 0,
}) => {
  const source = ragUsed ? "RAG" : toolName && toolName !== "none" && toolName !== "NONE" ? "TOOL" : "DIRECT";

  console.log("\n============================================================");
  console.log("AI REQUEST");
  console.log("============================================================");
  console.log("User Query:");
  console.log(userQuery);
  console.log("\nIntent:");
  console.log(intent || "UNKNOWN");
  console.log("\nAgent:");
  console.log(selectedAgent || "GENERAL_AGENT");
  console.log("\nSource:");
  console.log(source);

  if (ragUsed) {
    console.log("\nRAG Document:");
    console.log(ragDocument || "GENERAL");
    console.log("\nRAG Chunks:");
    console.log(retrievedChunksCount);
  } else {
    console.log("\nRAG:");
    console.log("not used");
  }

  console.log("\nTool:");
  console.log(toolName && toolName !== "NONE" ? toolName : "none");

  if (toolName && toolName !== "none" && toolName !== "NONE") {
    if (toolInput) console.log("\nTool Input:\n" + JSON.stringify(toolInput, null, 2));
    if (toolResult) console.log("\nTool Result:\n" + JSON.stringify(toolResult, null, 2));
  }

  if (timings) {
    console.log("\nTiming Breakdown:");
    console.log(`- Intent Classification: ${timings.intentTimeMs || 0} ms`);
    console.log(`- RAG Embedding:         ${timings.embeddingTimeMs || 0} ms`);
    console.log(`- Vector Search:         ${timings.vectorSearchTimeMs || 0} ms`);
    console.log(`- Tool Execution:        ${timings.toolTimeMs || 0} ms`);
    console.log(`- LLM Generation:        ${timings.llmTimeMs || 0} ms`);
    if (telegramSendTimeMs) {
      console.log(`- Telegram Send:         ${telegramSendTimeMs} ms`);
    }
  }

  console.log("\nResponse Time:");
  console.log(`${executionTimeMs} ms`);
  console.log("============================================================\n");
};
