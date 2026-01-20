import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";

import { auth } from "@/app/(auth)/auth";
import { Button } from "@/components/ui/button";
import { AgentList } from "@/features/agents/components/AgentList";

export default async function AgentsPage() {
    const session = await auth();

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-foreground pb-20">
            {/* Background Glow Effect */}
            <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden">
                <div className="h-[800px] w-[800px] rounded-full bg-blue-500/8 blur-[150px] animate-subtle-glow" />
            </div>
            <div className="pointer-events-none fixed top-0 right-0 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-[100px] animate-subtle-glow" style={{ animationDelay: '2s' }} />

            <div className="container mx-auto px-4 py-16 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-400/80 text-sm font-medium">
                            <Sparkles className="size-4" />
                            <span>AI-Powered Automation</span>
                        </div>
                        <h1 className="heading-elegant text-[44px] md:text-[56px] leading-[1.1] text-foreground">
                            My Agents
                        </h1>
                        <p className="text-[16px] text-muted-foreground/70 max-w-md leading-relaxed">
                            Create, manage, and deploy custom AI agents to automate your workflows and enhance productivity.
                        </p>
                    </div>
                    <Button
                        asChild
                        className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium btn-primary-glow shadow-lg shadow-blue-600/20"
                    >
                        <Link href="/agents/new" className="flex items-center gap-2">
                            <Plus className="size-5" />
                            <span>Create Agent</span>
                        </Link>
                    </Button>
                </div>

                {/* Stats Section (optional visual enhancement) */}
                <div className="grid grid-cols-3 gap-4 mb-12 max-w-md">
                    <div className="text-center p-4 rounded-xl bg-card/30 border border-border/20">
                        <div className="text-2xl font-semibold text-foreground">∞</div>
                        <div className="text-xs text-muted-foreground/60 mt-1">Possibilities</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-card/30 border border-border/20">
                        <div className="text-2xl font-semibold text-blue-400">24/7</div>
                        <div className="text-xs text-muted-foreground/60 mt-1">Availability</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-card/30 border border-border/20">
                        <div className="text-2xl font-semibold text-foreground">AI</div>
                        <div className="text-xs text-muted-foreground/60 mt-1">Powered</div>
                    </div>
                </div>

                {/* Agent List */}
                <AgentList userId={session?.user?.id} />
            </div>
        </div>
    );
}
