"use client";

import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function FilterSidebar() {
    return (
        <div className="flex flex-col gap-6 sticky top-24">
            <div>
                <h3 className="font-semibold mb-4 text-sm">Categories</h3>
                <div className="flex flex-col gap-2">
                    {["All", "Workflows", "Prompts", "Agents", "Themes"].map((cat, i) => (
                        <Button key={cat} variant={i === 0 ? "secondary" : "ghost"} className="justify-start h-8 px-2 text-sm w-full">
                            {cat}
                        </Button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="font-semibold mb-4 text-sm">Price Range</h3>
                <Slider defaultValue={[0]} max={100} step={1} className="mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Free</span>
                    <span>$100+</span>
                </div>
            </div>

            <div>
                <h3 className="font-semibold mb-4 text-sm">Rating</h3>
                <div className="flex flex-col gap-2">
                    {[4, 3, 2].map(bg => (
                        <div key={bg} className="flex items-center space-x-2">
                            <Checkbox id={`r-${bg}`} />
                            <Label htmlFor={`r-${bg}`} className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {bg}+ Stars
                            </Label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
