import { auth } from "@/app/(auth)/auth";
import { getAgentById } from "@/db/queries";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Bot, Cpu, Settings, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AgentDetailsPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function AgentDetailsPage(props: AgentDetailsPageProps) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user) {
        redirect("/");
    }

    const agent = await getAgentById(params.id);
    if (!agent) {
        notFound();
    }

    // Verify ownership
    if (agent.userId !== session.user.id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h1 className="text-2xl font-bold text-destructive">Unauthorized</h1>
                <p className="text-muted-foreground mt-2">You do not have permission to view this agent.</p>
                <Button asChild className="mt-4">
                    <Link href="/agents">Back to Agents</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="container max-w-5xl mx-auto px-4 py-12">
                <Button variant="ghost" asChild className="mb-8 hover:bg-muted/50">
                    <Link href="/agents" className="flex items-center gap-2">
                        <ArrowLeft className="size-4" />
                        Back to Agents
                    </Link>
                </Button>

                <div className="grid gap-8">
                    {/* Header Section */}
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-bold tracking-tight">{agent.name}</h1>
                                <Badge variant={agent.mode === "advanced" ? "default" : "secondary"} className="uppercase">
                                    {agent.mode}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground text-lg max-w-2xl">
                                {agent.description || "No description provided."}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button asChild variant="outline">
                                <Link href={`/agents/${agent.id}/edit`}>
                                    <Settings className="size-4 mr-2" />
                                    Edit Agent
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={`/chat?agent=${agent.id}`}>
                                    <MessageSquare className="size-4 mr-2" />
                                    Start Chat
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* System Prompt / Logic Card */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="size-5 text-primary" />
                                    System Logic
                                </CardTitle>
                                <CardDescription>
                                    The core behavior instructions for this agent.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="prose dark:prose-invert max-w-none">
                                {agent.mode === "simple" ? (
                                    <pre className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
                                        {agent.systemPrompt || "No system prompt defined."}
                                    </pre>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                                        <Cpu className="size-8 text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground text-center">
                                            This agent uses a complex node-based workflow.
                                            <br />
                                            <Link href={`/agents/${agent.id}/edit`} className="text-primary hover:underline">
                                                View Workflow Editor
                                            </Link>
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Model Configuration */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="size-5 text-primary" />
                                    Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground font-medium">Model provider</p>
                                        <p className="font-medium mt-1">
                                            {/* We'd fetch this from the model config relation ideally, but for now we might need a separate query or join */}
                                            {/* Placeholder until we fetch related config */}
                                            Unknown (Config ID: {agent.modelConfigId?.slice(0, 8)}...)
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground font-medium">Created</p>
                                        <p className="font-medium mt-1">{new Date(agent.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
}
