"use client";

import { Bot, Cpu, ArrowLeft, Loader2, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createAgentAction } from "@/features/agents/actions";
import { AdvancedAgentEditor } from "@/features/agents/components/AdvancedAgentEditor";
import { AiAgentGeneratorDialog } from "@/features/agents/components/AiAgentGeneratorDialog";
import { GeneratedAgentDetails, getAvailableTools } from "@/lib/api/agents";
import { type Tool } from "@/db/schema";
import { Check, Box } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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

export default function NewAgentPage() {
    const router = useRouter();
    const [mode, setMode] = useState<"simple" | "advanced">("simple");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");

    // New state for provider/model
    const [provider, setProvider] = useState("groq");
    const [model, setModel] = useState("llama-3.3-70b-versatile");
    const [apiKey, setApiKey] = useState("");

    // Tool state
    const [availableTools, setAvailableTools] = useState<Tool[]>([]);
    const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
    const [isToolsLoading, setIsToolsLoading] = useState(false);

    useEffect(() => {
        async function fetchTools() {
            setIsToolsLoading(true);
            try {
                const tools = await getAvailableTools();
                setAvailableTools(tools);
            } catch (error) {
                console.error("Failed to fetch tools:", error);
            } finally {
                setIsToolsLoading(false);
            }
        }
        fetchTools();
    }, []);

    const handleAiGenerate = (details: GeneratedAgentDetails) => {
        setName(details.name);
        setDescription(details.description);
        setSystemPrompt(details.systemPrompt);
        setProvider(details.suggestedProvider);

        // Auto-select suggested tools
        if (details.suggestedTools && details.suggestedTools.length > 0) {
            const suggestedToolIds = availableTools
                .filter(t => details.suggestedTools.includes(t.name))
                .map(t => t.id);
            setSelectedToolIds(suggestedToolIds);

            if (suggestedToolIds.length > 0) {
                toast.success(`Selected ${suggestedToolIds.length} tools suggested by AI`);
            }
        }

        // Update model based on provider
        const providerModels = MODELS[details.suggestedProvider];
        if (providerModels) {
            const matchingModel = providerModels.find(m => m.value === details.suggestedModel);
            if (matchingModel) {
                setModel(details.suggestedModel);
            } else {
                // Use first available model if exact match not found
                setModel(providerModels[0].value);
            }
        }

        toast.info(details.reasoning, { duration: 5000 });
    };

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value;
        setProvider(newProvider);
        // Set default model for new provider
        if (MODELS[newProvider]?.length > 0) {
            setModel(MODELS[newProvider][0].value);
        }
    };

    const handleSimpleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !systemPrompt || !apiKey) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("systemPrompt", systemPrompt);
            formData.append("provider", provider);
            formData.append("model", model);
            formData.append("apiKey", apiKey);
            formData.append("mode", "simple");
            formData.append("selectedTools", JSON.stringify(selectedToolIds));


            const result = await createAgentAction(formData);
            if (result.success) {
                toast.success("Agent created successfully!");
                router.push("/agents");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to create agent");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleModeChange = (v: string) => {
        if (v === "advanced") {
            toast.info("Coming soon!", {
                description: "Advanced agent creation is currently in development.",
            });
            return;
        }
        setMode(v as "simple" | "advanced");
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="container max-w-5xl mx-auto px-4 py-12">
                <Button variant="ghost" asChild className="mb-8 hover:bg-muted/50">
                    <Link href="/agents" className="flex items-center gap-2">
                        <ArrowLeft className="size-4" />
                        Back to Agents
                    </Link>
                </Button>

                <div className="flex flex-col gap-8">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight">Create Agent</h1>
                        <p className="text-muted-foreground text-lg italic">
                            Design your custom intelligence layer.
                        </p>
                    </div>

                    <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
                        <TabsList className="grid w-full max-w-md grid-cols-2 h-12 p-1 bg-muted/50">
                            <TabsTrigger value="simple" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Bot className="size-4" />
                                Simple
                            </TabsTrigger>
                            <TabsTrigger value="advanced" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Cpu className="size-4" />
                                Advanced
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-10">
                            <TabsContent value="simple" className="m-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
                                    <CardHeader className="space-y-4">
                                        <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                            <Sparkles className="size-6 text-blue-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl">Simple Agent</CardTitle>
                                            <CardDescription className="text-base mt-2">
                                                Create a straightforward agent powered by your choice of LLM. Ideal for specific tasks and personalities.
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mb-6">
                                            <AiAgentGeneratorDialog onGenerate={handleAiGenerate} mode="create" />
                                        </div>
                                        <form onSubmit={handleSimpleSubmit} className="space-y-8">
                                            <div className="grid gap-6">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="name" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Agent Name</Label>
                                                    <Input
                                                        id="name"
                                                        placeholder="e.g. Code Reviewer"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="bg-background/50 border-muted focus-visible:ring-primary h-11"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="description" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Description (Optional)</Label>
                                                    <Input
                                                        id="description"
                                                        placeholder="What does this agent do?"
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                        className="bg-background/50 border-muted focus-visible:ring-primary h-11"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="provider" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Provider</Label>
                                                        <select
                                                            id="provider"
                                                            value={provider}
                                                            onChange={handleProviderChange}
                                                            className="flex h-11 w-full rounded-md border border-muted bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {PROVIDERS.map((p) => (
                                                                <option key={p.value} value={p.value}>{p.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="model" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Model</Label>
                                                        <select
                                                            id="model"
                                                            value={model}
                                                            onChange={(e) => setModel(e.target.value)}
                                                            className="flex h-11 w-full rounded-md border border-muted bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {MODELS[provider]?.map((m) => (
                                                                <option key={m.value} value={m.value}>{m.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="apiKey" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                                                        {PROVIDERS.find(p => p.value === provider)?.label} API Key
                                                    </Label>
                                                    <Input
                                                        id="apiKey"
                                                        type="password"
                                                        placeholder={`Enter your ${provider} API key...`}
                                                        value={apiKey}
                                                        onChange={(e) => setApiKey(e.target.value)}
                                                        className="bg-background/50 border-muted focus-visible:ring-primary h-11"
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Your API key will be hashed and securely stored.
                                                    </p>
                                                </div>

                                                <div className="grid gap-4 p-4 rounded-xl border border-muted bg-muted/20">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Box className="size-4 text-blue-500" />
                                                            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Capabilities (Tools)</Label>
                                                        </div>
                                                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium uppercase">Optional</span>
                                                    </div>

                                                    {isToolsLoading ? (
                                                        <div className="flex items-center justify-center py-4">
                                                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {availableTools.map((tool) => (
                                                                <div
                                                                    key={tool.id}
                                                                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-background/80 ${selectedToolIds.includes(tool.id)
                                                                        ? "border-blue-500/50 bg-blue-500/5 shadow-sm shadow-blue-500/10"
                                                                        : "border-border/50 bg-background/50"
                                                                        }`}
                                                                    onClick={() => {
                                                                        setSelectedToolIds(prev =>
                                                                            prev.includes(tool.id)
                                                                                ? prev.filter(id => id !== tool.id)
                                                                                : [...prev, tool.id]
                                                                        );
                                                                    }}
                                                                >
                                                                    <div className={`mt-0.5 size-4 rounded border flex items-center justify-center transition-colors ${selectedToolIds.includes(tool.id)
                                                                        ? "bg-blue-500 border-blue-500 text-white"
                                                                        : "border-muted-foreground/30"
                                                                        }`}>
                                                                        {selectedToolIds.includes(tool.id) && <Check className="size-3" />}
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
                                                            ))}
                                                        </div>
                                                    )}
                                                    {availableTools.length === 0 && !isToolsLoading && (
                                                        <p className="text-sm text-center py-2 text-muted-foreground italic">No tools available.</p>
                                                    )}
                                                </div>

                                                <div className="grid gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="prompt" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">System Prompt</Label>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 text-xs text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                                            onClick={async () => {
                                                                if (!systemPrompt.trim()) {
                                                                    toast.error("Please enter a basic prompt first");
                                                                    return;
                                                                }

                                                                const toastId = toast.loading("Enhancing prompt with AI...");
                                                                try {
                                                                    const { enhanceSystemPrompt } = await import("@/lib/api/agents");
                                                                    const result = await enhanceSystemPrompt(systemPrompt);
                                                                    if (result) {
                                                                        setSystemPrompt(result.enhancedPrompt);
                                                                        toast.success("Prompt enhanced!", {
                                                                            id: toastId,
                                                                            description: result.improvements,
                                                                        });
                                                                    }
                                                                } catch (error) {
                                                                    toast.error("Failed to enhance prompt", { id: toastId });
                                                                }
                                                            }}
                                                        >
                                                            <Sparkles className="size-3 mr-1" />
                                                            Enhance with AI
                                                        </Button>
                                                    </div>
                                                    <Textarea
                                                        id="prompt"
                                                        placeholder="Define the behavior, constraints, and expertise of your agent..."
                                                        className="min-h-[200px] resize-none bg-background/50 border-muted focus-visible:ring-primary text-base p-4"
                                                        value={systemPrompt}
                                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20" disabled={isSubmitting}>
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                                        Creating Agent...
                                                    </>
                                                ) : (
                                                    "Create Simple Agent"
                                                )}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="advanced" className="m-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <AdvancedAgentEditor
                                    onSave={async (workflowData: any) => {
                                        setIsSubmitting(true);
                                        try {
                                            const result = await createAgentAction({
                                                name: workflowData.name,
                                                description: workflowData.description,
                                                mode: "advanced",
                                                workflow: workflowData
                                            });
                                            if (result.success) {
                                                toast.success("Advanced agent created!");
                                                router.push("/agents");
                                                router.refresh();
                                            } else {
                                                toast.error(result.error || "Failed to create agent");
                                            }
                                        } catch (e) {
                                            toast.error("Error saving workflow");
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }}
                                    isSubmitting={isSubmitting}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
