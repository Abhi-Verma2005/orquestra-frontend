"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
    value: "normal" | "builder";
    onChange: (value: "normal" | "builder") => void;
}

export function ModeToggle({ value, onChange }: ToggleProps) {
    return (
        <div className="inline-flex items-center rounded-full bg-muted/30 border border-border/30 p-1 text-[12px] font-medium">
            <button
                type="button"
                onClick={() => onChange("normal")}
                className={cn(
                    "px-3 py-1.5 rounded-full transition-all duration-200",
                    value === "normal"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                Normal Chat
            </button>
            <button
                type="button"
                onClick={() => onChange("builder")}
                className={cn(
                    "px-3 py-1.5 rounded-full transition-all duration-200",
                    value === "builder"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                Agent Builder
            </button>
        </div>
    );
}
