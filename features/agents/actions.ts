"use server";

import { auth } from "@/app/(auth)/auth";
import { createAgent, createModelConfig, createWorkflow, createWorkflowNode, createWorkflowEdge, saveApiKey } from "@/db/queries";
import { type Tool } from "@/db/schema";

import { revalidatePath } from "next/cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function createAgentAction(data: FormData | any) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    try {
        if (data instanceof FormData) {
            // Simple mode
            const name = data.get("name") as string;
            const description = data.get("description") as string;
            const systemPrompt = data.get("systemPrompt") as string;
            const apiKeyStr = data.get("apiKey") as string;
            const provider = data.get("provider") as string;
            const model = data.get("model") as string;
            const mode = data.get("mode") as "simple" | "advanced";

            // 1. Save API Key
            const apiKey = await saveApiKey(userId, provider, apiKeyStr, `${name} ${provider} Key`);

            // 2. Create a default Model Config for this agent
            const modelConfig = await createModelConfig({
                userId,
                name: `${name} Config`,
                provider: provider,
                model: model,
                apiKeyId: apiKey.id,
                temperature: 0.7,
            });

            const agent = await createAgent({
                userId,
                name,
                description,
                mode,
                systemPrompt,
                modelConfigId: modelConfig.id,
            });

            // 4. Link Tools
            const selectedTools = data.get("selectedTools") as string; // JSON array of IDs
            if (selectedTools) {
                const toolIds = JSON.parse(selectedTools);
                if (Array.isArray(toolIds) && toolIds.length > 0) {
                    await fetch(`${BACKEND_URL}/api/agents/${agent.id}/tools`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ toolIds }),
                    });
                }
            }

            revalidatePath("/agents");
            return { success: true, agentId: agent.id };
        } else {
            // Advanced mode
            const { name, description, mode, workflow } = data;

            // 1. Create Workflow
            const newWorkflow = await createWorkflow(name, description);

            // 2. Create Nodes
            for (const node of workflow.nodes) {
                // Here we might need to handle API keys for each node if they are different
                // For simplicity, let's assume one key for the whole agent if provided, 
                // or use existing ones. 
                // The user said "each node will have its own system prompt".
                await createWorkflowNode({
                    workflowId: newWorkflow.id,
                    nodeKey: node.id,
                    label: node.label,
                    nodeType: "agent",
                    systemPrompt: node.systemPrompt,
                    // modelConfigId: ... (needs to be linked to a config)
                });
            }

            // 3. Create Edges
            for (const edge of workflow.edges) {
                await createWorkflowEdge({
                    workflowId: newWorkflow.id,
                    sourceNodeKey: edge.source,
                    targetNodeKey: edge.target,
                });
            }

            // 4. Create Agent linked to Workflow
            const agent = await createAgent({
                userId,
                name,
                description,
                mode,
                workflowId: newWorkflow.id,
            });

            revalidatePath("/agents");
            return { success: true, agentId: agent.id };
        }
    } catch (error: any) {
        console.error("Action error:", error);
        return { success: false, error: error.message || "Failed to create agent" };
    }
}

export async function updateAgentAction(data: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    try {
        const id = data.get("id") as string;
        const name = data.get("name") as string;
        const description = data.get("description") as string;
        const systemPrompt = data.get("systemPrompt") as string;

        // Model config fields
        const provider = data.get("provider") as string;
        const model = data.get("model") as string;
        const apiKeyStr = data.get("apiKey") as string;

        const queries = await import("@/db/queries");

        // 1. Update Agent Basic Info
        const agent = await queries.getAgentById(id);
        if (!agent || agent.userId !== userId) {
            return { success: false, error: "Agent not found or unauthorized" };
        }

        await queries.updateAgent(id, { name, description, systemPrompt });

        // 2. Update Model Config if provided
        if (provider && model && agent.modelConfigId) {
            // If API key is provided, update it first
            let apiKeyId = undefined;
            if (apiKeyStr && apiKeyStr.trim() !== "") {
                const newKey = await queries.saveApiKey(userId, provider, apiKeyStr, `${name} ${provider} Key`);
                apiKeyId = newKey.id;
            }

            await queries.updateModelConfig(agent.modelConfigId, {
                provider,
                model,
                ...(apiKeyId ? { apiKeyId } : {})
            });
        }

        // 3. Update Tools
        const selectedTools = data.get("selectedTools") as string;
        if (selectedTools) {
            const toolIds = JSON.parse(selectedTools);
            if (Array.isArray(toolIds)) {
                await fetch(`${BACKEND_URL}/api/agents/${id}/tools`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ toolIds }),
                });
            }
        }


        revalidatePath(`/agents/${id}`);
        revalidatePath("/agents");
        return { success: true };
    } catch (error: any) {
        console.error("Update error:", error);
        return { success: false, error: error.message || "Failed to update agent" };
    }
}

export async function getAgentAction(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const agent = await import("@/db/queries").then(mod => mod.getAgentById(id));
        if (!agent) {
            return { success: false, error: "Agent not found" };
        }

        // Check ownership
        if (agent.userId !== session.user.id) {
            return { success: false, error: "Unauthorized" };
        }

        let modelConfig = null;
        if (agent.modelConfigId) {
            const queryMod = await import("@/db/queries");
            const config = await queryMod.getModelConfigById(agent.modelConfigId);
            if (config) {
                modelConfig = config;
            }
        }

        let tools = [];
        try {
            const response = await fetch(`${BACKEND_URL}/api/agents/${id}/tools`);
            if (response.ok) {
                tools = await response.json();
            }
        } catch (e) {
            console.error("Failed to fetch agent tools", e);
        }

        return { success: true, agent, modelConfig, tools };
    } catch (error: any) {
        console.error("Fetch error:", error);
        return { success: false, error: "Failed to fetch agent" };
    }
}
