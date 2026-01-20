import { Bot, Cpu, Plus, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAgentsByUserId } from "@/db/queries";
import { DeleteAgentButton } from "./DeleteAgentButton";

interface AgentListProps {
    userId?: string;
}

export async function AgentList({ userId }: AgentListProps) {
    if (!userId) return null;

    let agents: any[] = [];
    try {
        agents = await getAgentsByUserId(userId);
    } catch (e) {
        console.error("Failed to fetch agents:", e);
    }

    if (agents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-8 border border-dashed border-border/30 rounded-2xl bg-card/20 text-center">
                <div className="size-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-8 icon-glow">
                    <Bot className="size-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-medium text-foreground mb-3">No agents yet</h3>
                <p className="text-muted-foreground/70 mb-10 max-w-md text-[15px] leading-relaxed">
                    Create your first AI agent to automate tasks, build custom workflows, and supercharge your productivity.
                </p>
                <Button
                    asChild
                    className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium btn-primary-glow"
                >
                    <Link href="/agents/new" className="flex items-center gap-2">
                        <Plus className="size-5" />
                        <span>Create Your First Agent</span>
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((agent: any) => (
                <div
                    key={agent.id}
                    className="group relative p-6 rounded-2xl bg-card/40 border border-border/30 hover:border-blue-500/30 transition-all duration-300 card-glow"
                >
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-5">
                        <div className="size-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-600/20 transition-all">
                            {agent.mode === "advanced" ? (
                                <Cpu className="size-6 text-blue-400" />
                            ) : (
                                <Bot className="size-6 text-blue-400" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground uppercase tracking-wider">
                                {agent.mode}
                            </span>
                            <DeleteAgentButton
                                agentId={agent.id}
                                agentName={agent.name}
                                userId={userId!}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-blue-100 transition-colors">
                            {agent.name}
                        </h3>
                        <p className="text-[14px] text-muted-foreground/70 line-clamp-2 leading-relaxed h-10">
                            {agent.description || "No description provided."}
                        </p>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground/50 mb-6">
                        <Sparkles className="size-3.5" />
                        <span>{agent.mode === "advanced" ? "Node-based workflow" : "Simple prompt"}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Link
                            href={`/agents/${agent.id}`}
                            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-border/40 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:border-border/60 hover:bg-muted/20 transition-all"
                        >
                            View Details
                        </Link>
                        <Link
                            href={`/agents/${agent.id}/edit`}
                            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-secondary/50 text-[13px] font-medium text-foreground hover:bg-secondary/70 transition-all"
                        >
                            Edit
                            <ArrowRight className="size-3.5" />
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
}
