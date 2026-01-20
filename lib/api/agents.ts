export interface GeneratedAgentDetails {
  name: string;
  description: string;
  systemPrompt: string;
  suggestedProvider: string;
  suggestedModel: string;
  reasoning: string;
  suggestedTools: string[];
}

export async function generateAgentDetails(
  description: string
): Promise<GeneratedAgentDetails> {
  const response = await fetch("/api/agents/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to generate agent details");
  }

  return response.json();
}

export interface EnhancedSystemPrompt {
  enhancedPrompt: string;
  improvements: string;
}

export async function enhanceSystemPrompt(systemPrompt: string): Promise<EnhancedSystemPrompt> {
  const response = await fetch('/api/agents/enhance-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt }),
  });

  if (!response.ok) {
    throw new Error('Failed to enhance system prompt');
  }

  return response.json();
}

export async function getAvailableTools(): Promise<any[]> {
  const response = await fetch('/api/tools');
  if (!response.ok) {
    throw new Error('Failed to fetch available tools');
  }
  return response.json();
}

export async function getAgentTools(agentId: string): Promise<any[]> {
  const response = await fetch(`/api/agents/${agentId}/tools`);
  if (!response.ok) {
    throw new Error('Failed to fetch agent tools');
  }
  return response.json();
}

export async function updateAgentTools(agentId: string, toolIds: string[]): Promise<void> {
  const response = await fetch(`/api/agents/${agentId}/tools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to update agent tools');
  }
}
