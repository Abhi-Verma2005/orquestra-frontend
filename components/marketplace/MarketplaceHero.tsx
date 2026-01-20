"use client";

import { Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MarketplaceHero() {
    return (
        <div className="relative overflow-hidden bg-background border-b border-border">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background" />

            <div className="container relative mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
                <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-sm text-muted-foreground mb-6 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-3 duration-500">
                    <Sparkles className="mr-2 size-3.5 text-primary" />
                    <span>Discover 500+ AI Workflows</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    Orq Marketplace
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
                    Explore tailored prompts, agent skills, and full workflows to supercharge your development.
                </p>

                <div className="w-full max-w-2xl relative animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <Input
                        className="w-full pl-12 h-14 rounded-full bg-background/50 backdrop-blur-xl border-border shadow-2xl focus-visible:ring-primary/20 text-lg transition-all hover:border-primary/50 hover:bg-background/80"
                        placeholder="Search workflows, tools, and prompts..."
                    />
                </div>

                <div className="flex flex-wrap gap-2 mt-6 justify-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
                    <span className="text-sm text-muted-foreground self-center mr-2">Trending:</span>
                    {["Next.js", "Python Agent", "SEO Optimizer", "Code Review"].map(tag => (
                        <Button key={tag} variant="secondary" size="sm" className="rounded-full h-7 text-xs bg-muted/50 hover:bg-muted border border-transparent hover:border-border">
                            {tag}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
