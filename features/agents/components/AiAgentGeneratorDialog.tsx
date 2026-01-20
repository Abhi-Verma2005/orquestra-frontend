"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Sparkles } from "lucide-react";
import { generateAgentDetails, GeneratedAgentDetails } from "@/lib/api/agents";
import { toast } from "sonner";

interface AiAgentGeneratorDialogProps {
  onGenerate: (details: GeneratedAgentDetails) => void;
  mode?: "create" | "edit";
  trigger?: React.ReactNode;
}

export function AiAgentGeneratorDialog({
  onGenerate,
  mode = "create",
  trigger,
}: AiAgentGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Please describe your agent");
      return;
    }

    if (description.length > 2000) {
      toast.error("Description too long (max 2000 characters)");
      return;
    }

    setLoading(true);
    try {
      const details = await generateAgentDetails(description);
      onGenerate(details);
      setOpen(false);
      setDescription("");
      toast.success("Agent details generated!");

      // Show reasoning as additional info
      if (details.reasoning) {
        toast.info(details.reasoning, { duration: 5000 });
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger || (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Sparkles className="mr-2 h-4 w-4" />
          {mode === "edit" ? "Regenerate with AI" : "Generate with AI"}
        </Button>
      )}
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === "edit" ? "Describe Changes" : "Describe Your Agent"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {mode === "edit"
              ? "Tell me what changes you'd like to make to this agent"
              : "Tell me what you want your agent to do, and I'll generate the details"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="E.g., A code reviewer that checks Python code for bugs and style issues"
          className="min-h-[120px]"
          maxLength={2000}
          disabled={loading}
        />
        <div className="text-xs text-gray-500 text-right mb-2">
          {description.length}/2000
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
