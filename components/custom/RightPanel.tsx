"use client";

import { X } from "lucide-react";

import { useSplitScreen } from "../../contexts/SplitScreenProvider";
import { Button } from "../ui/button";

export function RightPanel() {
  const { rightPanelContent, closeRightPanel } = useSplitScreen();

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-3 shrink-0 border-b border-border bg-muted/30">
        <h2 className="text-sm font-medium text-foreground">
          Context
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeRightPanel}
          className="size-7 rounded-full hover:bg-muted"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {rightPanelContent || (
          <div className="text-sm text-muted-foreground text-center py-8">
            No active context
          </div>
        )}
      </div>
    </div>
  );
}
