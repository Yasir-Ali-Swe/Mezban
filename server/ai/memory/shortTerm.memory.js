import prisma from "../../config/prisma.js";

/**
 * Retrieves short-term conversation context (recent messages)
 */
export async function getShortTermMemory(conversationId, limit = 10) {
  if (!conversationId) return [];

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Reverse so older messages come first
  return messages.reverse().map((msg) => ({
    sender: msg.sender,
    agentType: msg.agentType,
    content: msg.content,
    createdAt: msg.createdAt,
  }));
}
