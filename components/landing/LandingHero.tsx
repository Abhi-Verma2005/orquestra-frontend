"use client";

import Link from "next/link";
import { ArrowRight, Terminal, Cpu, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingHero() {
    return (
        <div className="relative overflow-hidden bg-background pt-24 pb-20 md:pt-32 md:pb-24">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            <div className="absolute top-0 w-full h-[600px] bg-gradient-to-b from-primary/5 via-primary/5 to-transparent blur-3xl opacity-20" />

            <div className="container relative mx-auto px-4 text-center">
                <div className="inline-flex items-center rounded-full border border-border bg-muted/30 px-3 py-1 text-sm text-muted-foreground mb-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                    <span>v1.0 Public Beta is Live</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
                    Build Agentic AI<br />
                    Workflows in Minutes
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                    Orq combines real-time collaboration, visual workflow orchestration, and a marketplace of skills to supercharge your development.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                    <Button size="lg" className="h-12 px-8 text-base rounded-full" asChild>
                        <Link href="/chat">
                            Start Building <ArrowRight className="ml-2 size-4" />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-full" asChild>
                        <Link href="/marketplace">
                            Explore Marketplace
                        </Link>
                    </Button>
                </div>

                <div className="mt-20 relative animate-in fade-in zoom-in-50 duration-1000 delay-500">
                    <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden aspect-[16/9] max-w-5xl mx-auto relative group">
                        {/* Abstract UI representation */}
                        <div className="absolute inset-0 bg-zinc-950/50" />
                        <div className="grid grid-cols-[250px_1fr_300px] h-full opacity-60">
                            <div className="border-r border-white/10 p-4 space-y-3">
                                <div className="h-8 w-3/4 bg-white/10 rounded" />
                                <div className="h-4 w-1/2 bg-white/5 rounded" />
                                <div className="h-4 w-2/3 bg-white/5 rounded" />
                                <div className="mt-8 space-y-2">
                                    {[1, 2, 3].map(i => <div key={i} className="h-12 w-full bg-white/5 rounded" />)}
                                </div>
                            </div>
                            <div className="p-6 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 blur-[100px] rounded-full" />
                                <div className="space-y-4">
                                    <div className="flex justify-end"><div className="h-16 w-2/3 bg-primary/20 rounded-2xl rounded-tr-sm" /></div>
                                    <div className="flex justify-start"><div className="h-24 w-2/3 bg-muted/20 rounded-2xl rounded-tl-sm" /></div>
                                </div>
                            </div>
                            <div className="border-l border-white/10 p-4 bg-zinc-900/50">
                                <div className="h-6 w-1/2 bg-white/10 rounded mb-4" />
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-20 w-full bg-white/5 rounded mb-3" />)}
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-background/80 backdrop-blur-md border border-border px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl">
                                <Zap className="text-yellow-500 fill-yellow-500 size-5" />
                                <span className="font-semibold">AI Orchestrator Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
