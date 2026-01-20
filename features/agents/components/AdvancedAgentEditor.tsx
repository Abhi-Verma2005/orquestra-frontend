"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Settings2, Sparkles, MessageSquare, Save, Cpu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, Reorder } from "framer-motion";

interface Node {
    id: string;
    label: string;
    systemPrompt: string;
}

interface AdvancedAgentEditorProps {
    onSave: (data: any) => Promise<void>;
    isSubmitting: boolean;
}

export function AdvancedAgentEditor({ onSave, isSubmitting }: AdvancedAgentEditorProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [nodes, setNodes] = useState<Node[]>([
        { id: "1", label: "Initial Processor", systemPrompt: "You are the first stage of the pipeline..." }
    ]);

    const addNode = () => {
        const newNode: Node = {
            id: Math.random().toString(36).substr(2, 9),
            label: `Stage ${nodes.length + 1}`,
            systemPrompt: ""
        };
        setNodes([...nodes, newNode]);
    };

    const removeNode = (id: string) => {
        if (nodes.length > 1) {
            setNodes(nodes.filter(n => n.id !== id));
        }
    };

    const updateNode = (id: string, updates: Partial<Node>) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, ...updates } : n));
    };

    const handleSave = () => {
        if (!name) return;
        onSave({
            name,
            description,
            nodes,
            edges: nodes.slice(0, -1).map((node, i) => ({
                source: node.id,
                target: nodes[i + 1].id
            }))
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="adv-name" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Workflow Name</Label>
                            <Input
                                id="adv-name"
                                placeholder="e.g. Multi-stage Research"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-background/50 border-muted h-11"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="adv-desc" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">Description</Label>
                            <Input
                                id="adv-desc"
                                placeholder="Explain what this workflow accomplishes"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-background/50 border-muted h-11"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <Cpu className="size-5 text-primary" />
                        <h3 className="text-xl font-bold tracking-tight">Execution Chain</h3>
                    </div>
                    <Button onClick={addNode} variant="outline" size="sm" className="gap-2 border-primary/20 hover:border-primary/50 text-primary">
                        <Plus className="size-4" />
                        Add Connection
                    </Button>
                </div>

                <Reorder.Group axis="y" values={nodes} onReorder={setNodes} className="space-y-4">
                    {nodes.map((node, index) => (
                        <Reorder.Item key={node.id} value={node}>
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="border-border/50 shadow-md group overflow-hidden bg-card/30 hover:bg-card/50 transition-colors">
                                    <div className="flex">
                                        <div className="w-12 bg-muted/30 flex flex-col items-center py-4 border-r border-border/50">
                                            <div className="size-6 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground mb-4">
                                                {index + 1}
                                            </div>
                                            <GripVertical className="size-4 text-muted-foreground/30 cursor-grab active:cursor-grabbing" />
                                        </div>
                                        <div className="flex-1 p-6 space-y-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <Input
                                                        value={node.label}
                                                        onChange={(e) => updateNode(node.id, { label: e.target.value })}
                                                        className="font-semibold text-lg bg-transparent border-transparent hover:border-muted focus:border-primary h-auto p-0 px-2 -ml-2"
                                                        placeholder="Node Label"
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-muted-foreground hover:text-destructive transition-colors"
                                                    onClick={() => removeNode(node.id)}
                                                    disabled={nodes.length <= 1}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>

                                            <div className="grid gap-2">
                                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                                                    <MessageSquare className="size-3" />
                                                    Node Instruction (System Prompt)
                                                </div>
                                                <Textarea
                                                    placeholder="Instruction for this node..."
                                                    value={node.systemPrompt}
                                                    onChange={(e) => updateNode(node.id, { systemPrompt: e.target.value })}
                                                    className="min-h-[120px] resize-none bg-background/30 border-muted p-4 focus-visible:ring-primary/30"
                                                />
                                            </div>

                                            {index < nodes.length - 1 && (
                                                <div className="absolute -bottom-4 left-[22px] z-10">
                                                    <div className="h-4 w-0.5 bg-primary/30" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            </div>

            <Button
                onClick={handleSave}
                className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 gap-3"
                disabled={isSubmitting || !name}
            >
                {isSubmitting ? (
                    <Loader2 className="size-6 animate-spin" />
                ) : (
                    <>
                        <Save className="size-5" />
                        Save Advanced Workflow
                    </>
                )}
            </Button>
        </div>
    );
}
