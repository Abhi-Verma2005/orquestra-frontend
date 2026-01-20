"use client";

import { useUserInfo } from "@/contexts/UserInfoProvider";
import { ArrowUp, Globe, Mic, Plus, Sparkles, X, ChevronDown, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/ui/toggle";
import { useAgents } from "@/features/chat/hooks/use-agents";
import { useSession } from "next-auth/react";

export function LandingHero() {
    const { userInfo } = useUserInfo();
    const { data: session } = useSession();
    const router = useRouter();
    const { agents } = useAgents();
    const [greeting, setGreeting] = useState("Good morning");
    const [mounted, setMounted] = useState(false);
    const [mode, setMode] = useState<"normal" | "builder">("normal");
    const [input, setInput] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string; description?: string } | null>(null);
    const [showAgentDropdown, setShowAgentDropdown] = useState(false);

    useEffect(() => {
        setMounted(true);
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 18) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, []);

    // Handle normal chat submission
    const handleNormalChatSubmit = async () => {
        if (!input.trim() || isCreating) return;

        const trimmedInput = input.trim();
        setIsCreating(true);

        const userMsg = {
            id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
            role: "user",
            content: trimmedInput,
        };

        try {
            const authHeader = (session as any)?.accessToken ? `Bearer ${(session as any).accessToken}` : "";

            const res = await fetch("/api/chat/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authHeader
                },
                body: JSON.stringify({
                    message: userMsg,
                    agent_id: selectedAgent?.id
                }),
            });

            if (!res.ok) {
                console.error("Failed to create chat:", res.status, res.statusText);
                setIsCreating(false);
                return;
            }

            const data = await res.json();
            const newId = data?.id as string;

            if (!newId) {
                setIsCreating(false);
                return;
            }

            // Store pending message
            try {
                sessionStorage.setItem(
                    `pending_first_message_${newId}`,
                    JSON.stringify({
                        message: userMsg,
                        agent_id: selectedAgent?.id,
                        selectedAgent: selectedAgent // Store full agent for UI persistence
                    })
                );
            } catch { }

            // Navigate to new chat
            router.push(`/chat/${newId}`);
        } catch (e) {
            console.error("Exception creating chat:", e);
            setIsCreating(false);
        }
    };

    // Suggestions pills - simpler, inline style like Blink
    const suggestions = [
        { icon: Globe, label: "AI Landing Page Builder" },
        { icon: Sparkles, label: "AI Customer Support Chatbot Platform" },
        { icon: Sparkles, label: "Sales Pitch Presentation" },
    ];

    if (!mounted) return null;

    return (
        <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-background px-4">
            {/* Subtle Spotlight Background */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                <div className="h-[600px] w-[600px] bg-blue-500/10 blur-[120px] rounded-full opacity-40" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center"
            >
                {/* Small Badge - More Subtle */}
                <div className="mb-6 inline-flex items-center rounded-full border border-border/30 bg-muted/30 px-3 py-1 text-[11px] font-medium text-muted-foreground/80">
                    AI Agent Builder
                </div>

                {/* Main Heading - Elegant Serif with Brand Italicized */}
                <h1 className="mb-4 text-[42px] md:text-[56px] lg:text-[64px] font-normal tracking-tight text-foreground leading-[1.1]">
                    Don't just think it
                    <br />
                    <span className="italic font-serif">Orq</span> it
                </h1>

                {/* Subheading - Concise for better layout */}
                <p className="mb-8 max-w-xl text-[15px] text-muted-foreground leading-relaxed">
                    Build full-stack apps in minutes just by chatting.
                    Everything included: database, hosting, and AI.
                </p>

                {/* Mode Toggle */}
                <div className="mb-4">
                    <ModeToggle value={mode} onChange={setMode} />
                </div>

                {/* Input Box - Original Beautiful Design with Functionality */}
                <div className="w-full max-w-3xl">
                    {mode === "normal" ? (
                        <div className="relative rounded-xl border border-border/40 bg-[#0C0C0D] shadow-xl overflow-visible">
                            {/* Agent Dropdown */}
                            {showAgentDropdown && agents.length > 0 && (
                                <div className="absolute bottom-full left-4 mb-2 w-72 bg-[#0C0C0D] border border-border/30 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="p-2 max-h-64 overflow-y-auto">
                                        <div className="text-[11px] font-medium text-muted-foreground/60 px-2 py-1 mb-1 uppercase tracking-wider">Select AI Agent</div>
                                        {agents.map((agent) => (
                                            <button
                                                type="button"
                                                key={agent.id}
                                                onClick={() => {
                                                    setSelectedAgent(agent);
                                                    setShowAgentDropdown(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-[13px] rounded-lg hover:bg-muted/30 transition-colors flex items-center gap-2 ${selectedAgent?.id === agent.id ? 'bg-blue-500/10 border border-blue-500/20' : ''}`}
                                            >
                                                <div className="size-7 rounded-full bg-blue-500/20 flex items-center justify-center text-[11px] font-medium text-blue-400">
                                                    {agent.name.substring(0, 1).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col overflow-hidden flex-1">
                                                    <span className="font-medium text-foreground truncate">{agent.name}</span>
                                                    {agent.description && (
                                                        <span className="text-[11px] text-muted-foreground/60 truncate">{agent.description}</span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col p-5">
                                {/* Input Text */}
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleNormalChatSubmit();
                                        }
                                    }}
                                    placeholder="Build an AI professional headshot generator"
                                    className="text-[15px] text-foreground mb-16 bg-transparent border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none outline-none placeholder:text-muted-foreground/50"
                                    rows={1}
                                    disabled={isCreating}
                                />

                                {/* Bottom Toolbar */}
                                <div className="flex items-center justify-between">
                                    {/* Left Tools */}
                                    <div className="flex items-center gap-3 text-muted-foreground/70 text-[13px]">
                                        <button className="hover:text-foreground transition-colors p-1" disabled={isCreating}>
                                            <Plus className="h-4 w-4" />
                                        </button>

                                        {selectedAgent ? (
                                            <div className="flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[12px]">
                                                <div className="size-4 rounded-full bg-blue-500/30 flex items-center justify-center text-[9px] font-medium text-blue-400">
                                                    {selectedAgent.name.substring(0, 1).toUpperCase()}
                                                </div>
                                                <span className="text-blue-400 max-w-[100px] truncate">{selectedAgent.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedAgent(null)}
                                                    className="hover:text-foreground ml-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                                                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                                                disabled={agents.length === 0}
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                                <span>Auto</span>
                                                <ChevronDown className="h-3 w-3 opacity-60" />
                                            </button>
                                        )}

                                        {/* Lavender Pill */}
                                        <div className="flex items-center gap-2 rounded-full bg-muted/30 border border-border/30 px-2.5 py-1 text-[12px]">
                                            <div className="flex -space-x-1">
                                                <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                                                <div className="h-2.5 w-2.5 rounded-full bg-white" />
                                            </div>
                                            <span className="text-muted-foreground">Lavender</span>
                                            <button className="hover:text-foreground ml-0.5">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Right Tools */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/70 cursor-pointer hover:text-foreground transition-colors">
                                            <Globe className="h-3.5 w-3.5" />
                                            <span>Public</span>
                                        </div>
                                        <button className="text-muted-foreground/70 hover:text-foreground transition-colors p-1" disabled={isCreating}>
                                            <Mic className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={handleNormalChatSubmit}
                                            disabled={!input.trim() || isCreating}
                                            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isCreating ? (
                                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <ArrowUp className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative rounded-xl border border-border/40 bg-[#0C0C0D] shadow-xl overflow-hidden">
                            <div className="flex flex-col p-5">
                                <div className="text-[15px] text-muted-foreground text-center py-8">
                                    <span className="text-foreground/60">Agent Builder coming soon...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Suggestions - Simpler Inline Pills */}
                <div className="mt-10 flex flex-col items-center gap-4">
                    <p className="text-[13px] text-muted-foreground/70">Not sure where to start? Try one of these:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {suggestions.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => setInput(item.label)}
                                className="flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/20 px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors cursor-pointer"
                            >
                                <item.icon className="h-3 w-3" />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
