"use client";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Box } from "lucide-react";
import { getAvailableTools } from "@/lib/api/agents";
import { type Tool } from "@/db/schema";

// We'll update actions.ts to include this
import { updateAgentAction, getAgentAction } from "@/features/agents/actions";

// Constants (Should be shared but localized for now)
const PROVIDERS = [
    { value: "groq", label: "Groq" },
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Anthropic" },
    { value: "gemini", label: "Google Gemini" },
    { value: "cohere", label: "Cohere" },
];

const MODELS: Record<string, { value: string; label: string }[]> = {
    groq: [
        { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
        { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
    ],
    openai: [
        { value: "gpt-4o", label: "GPT-4o" },
        { value: "gpt-4", label: "GPT-4" },
        { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
    anthropic: [
        { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
        { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet" },
        { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
    ],
    gemini: [
        { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
        { value: "gemini-1.0-pro", label: "Gemini 1.0 Pro" },
    ],
    cohere: [
        { value: "command-r", label: "Command R" },
        { value: "command-r-plus", label: "Command R+" },
    ],
};

interface EditAgentPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EditAgentPage(props: EditAgentPageProps) {
    // Handling async params unwrapping as required in Next.js 15
    const [agentId, setAgentId] = useState<string | null>(null);

    useEffect(() => {
        props.params.then(p => setAgentId(p.id));
    }, [props.params]);

    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [provider, setProvider] = useState("groq");
    const [model, setModel] = useState("");
    const [apiKey, setApiKey] = useState("");

    // Tools State
    const [availableTools, setAvailableTools] = useState<Tool[]>([]);
    const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
    const [isToolsLoading, setIsToolsLoading] = useState(true);

    // Fetch agent data on mount
    useEffect(() => {
        if (!agentId) return;

        async function fetchAgent() {
            try {
                const result = await getAgentAction(agentId!);

                if (!result.success || !result.agent) {
                    throw new Error(result.error || "Failed to fetch agent");
                }

                const data = result.agent;
                setName(data.name);
                setDescription(data.description || "");
                setSystemPrompt(data.systemPrompt || "");

                if (result.modelConfig) {
                    setProvider(result.modelConfig.provider);
                    setModel(result.modelConfig.model);
                }

                if (result.tools) {
                    setSelectedToolIds(result.tools.map((t: any) => t.id));
                }
            } catch (error) {
                toast.error("Could not load agent details");
                router.push("/agents");
            } finally {
                setIsLoading(false);
            }
        }

        async function fetchTools() {
            try {
                const tools = await getAvailableTools();
                setAvailableTools(tools);
            } catch (error) {
                console.error("Failed to fetch tools:", error);
            } finally {
                setIsToolsLoading(false);
            }
        }

        fetchAgent();
        fetchTools();
    }, [agentId, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agentId) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("id", agentId);
            formData.append("name", name);
            formData.append("description", description);
            formData.append("systemPrompt", systemPrompt);
            formData.append("provider", provider);
            formData.append("model", model);
            formData.append("apiKey", apiKey);
            formData.append("selectedTools", JSON.stringify(selectedToolIds));

            const result = await updateAgentAction(formData);
            if (result.success) {
                toast.success("Agent updated successfully");
                router.push(`/agents/${agentId}`);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to update agent");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="container max-w-3xl mx-auto px-4 py-12">
                <Button variant="ghost" asChild className="mb-8 hover:bg-muted/50">
                    <Link href={`/agents/${agentId}`} className="flex items-center gap-2">
                        <ArrowLeft className="size-4" />
                        Back to Details
                    </Link>
                </Button>

                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Agent</h1>
                        <p className="text-muted-foreground mt-2">
                            Update your agent's persona and instructions.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Agent Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                {/* Model Configuration Section */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="provider">Provider</Label>
                                        <select
                                            id="provider"
                                            value={provider}
                                            onChange={(e) => {
                                                setProvider(e.target.value);
                                                if (MODELS[e.target.value]?.length > 0) {
                                                    setModel(MODELS[e.target.value][0].value);
                                                }
                                            }}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {PROVIDERS.map((p) => (
                                                <option key={p.value} value={p.value}>{p.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="model">Model</Label>
                                        <select
                                            id="model"
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {MODELS[provider]?.map((m) => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="apiKey">Update API Key (Optional)</Label>
                                    <Input
                                        id="apiKey"
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="Leave empty to keep existing key"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="prompt">System Prompt</Label>
                                    <Textarea
                                        id="prompt"
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                        className="min-h-[200px]"
                                        required
                                    />
                                </div>

                                {/* Tools Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">
                                            Capabilities (Tools)
                                        </Label>
                                    </div>

                                    {isToolsLoading ? (
                                        <div className="flex items-center justify-center py-4 border rounded-xl bg-muted/30">
                                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {availableTools.map((tool) => {
                                                const isSelected = selectedToolIds.includes(tool.id);
                                                return (
                                                    <div
                                                        key={tool.id}
                                                        onClick={() => {
                                                            setSelectedToolIds(prev =>
                                                                isSelected
                                                                    ? prev.filter(id => id !== tool.id)
                                                                    : [...prev, tool.id]
                                                            );
                                                        }}
                                                        className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isSelected
                                                            ? "bg-primary/5 border-primary shadow-[0_0_0_1px_rgba(var(--primary),0.1)]"
                                                            : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-muted-foreground/20"
                                                            }`}
                                                    >
                                                        <div className={`mt-0.5 flex size-5 items-center justify-center rounded-md border transition-colors ${isSelected
                                                            ? "bg-primary border-primary text-primary-foreground"
                                                            : "bg-background border-input text-transparent group-hover:border-muted-foreground/30"
                                                            }`}>
                                                            <Check className={`size-3.5 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-sm font-medium leading-none" title={tool.description}>{tool.displayName}</span>
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground mt-1 truncate">
                                                                {tool.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4">
                                    <Button variant="outline" type="button" asChild>
                                        <Link href={`/agents/${agentId}`}>Cancel</Link>
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 size-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
