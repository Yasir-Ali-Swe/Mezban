export class AiError extends Error {
  constructor(message, code = "AI_ERROR", details = null) {
    super(message);
    this.name = "AiError";
    this.code = code;
    this.details = details;
  }
}

export class RagError extends AiError {
  constructor(message, details = null) {
    super(message, "RAG_ERROR", details);
    this.name = "RagError";
  }
}

export class ToolError extends AiError {
  constructor(toolName, message, details = null) {
    super(`Tool [${toolName}] failed: ${message}`, "TOOL_ERROR", details);
    this.name = "ToolError";
    this.toolName = toolName;
  }
}

export class AgentError extends AiError {
  constructor(agentType, message, details = null) {
    super(`Agent [${agentType}] failed: ${message}`, "AGENT_ERROR", details);
    this.name = "AgentError";
    this.agentType = agentType;
  }
}
