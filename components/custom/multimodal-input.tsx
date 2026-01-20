"use client";

import { Attachment, ChatRequestOptions, CreateMessage, Message } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
  ChangeEvent,
} from "react";
import { toast } from "sonner";
import { ChevronDown, Bot, X, Plus, Globe, Mic, Sparkles, Settings } from "lucide-react";

import { useAgents } from "@/features/chat/hooks/use-agents";

import { ArrowUpIcon, StopIcon, ImageIcon, LoaderIcon } from "./icons";
import Logo from "./logo";
import { PreviewAttachment } from "./preview-attachment";
import useWindowSize from "./use-window-size";
import { Textarea } from "../ui/textarea";

const suggestedActions = [
  {
    title: "What can you help me with?",
    label: "Discover capabilities and features",
    action: "What can you help me with? What are your capabilities?",
    icon: Sparkles,
  },
  {
    title: "Explain this to me",
    label: "Get a simple explanation",
    action: "Can you explain this in simple terms?",
    icon: Sparkles,
  },
  {
    title: "Give me suggestions",
    label: "Get recommendations and ideas",
    action: "Can you give me some suggestions or recommendations?",
    icon: Sparkles,
  },
];

export function MultimodalInput({
  input,
  setInput,
  isLoading,
  stop,
  isCreatingChat,
  attachments,
  setAttachments,
  messages,
  append,
  handleSubmit,
  selectedAgent,
  setSelectedAgent,
}: {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  isCreatingChat?: boolean;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
  selectedAgent: { id: string; name: string; description?: string } | null;
  setSelectedAgent: (agent: { id: string; name: string; description?: string } | null) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200;
      const newHeight = Math.min(scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  const { agents } = useAgents();
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setInput(newValue);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [attachments, handleSubmit, setAttachments, width]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/files/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      } else {
        const { error } = await response.json();
        toast.error(error);
      }
    } catch (error) {
      toast.error("Failed to upload file, please try again!");
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error("Error uploading files!", error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const placeholderText = messages.length > 0 ? "Send a follow up..." : "Ask me anything...";

  return (
    <div className="relative w-full flex flex-col gap-4">
      {/* Empty State - Blink Style */}
      {messages.length === 0 && attachments.length === 0 && uploadQueue.length === 0 && (
        <div className="flex flex-col gap-6 items-center w-full mx-auto max-w-3xl mb-4">
          {/* Subtle Background */}
          <div className="pointer-events-none absolute -z-10 inset-0 flex items-center justify-center">
            <div className="w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 bg-blue-500/20" />
          </div>

          {/* Welcome Header - Blink Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <h1 className="text-[32px] md:text-[42px] font-normal tracking-tight text-foreground italic">
              What can I help you build?
            </h1>
            <p className="text-[14px] text-muted-foreground/70 max-w-md">
              Start a conversation with AI to build websites, apps, and more.
            </p>
          </motion.div>
        </div>
      )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-scroll">
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: "",
                name: filename,
                contentType: "",
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      {/* Main Input Container - Blink Style */}
      <div className={`relative w-full rounded-xl border border-border/40 bg-[#0C0C0D] shadow-xl overflow-visible ${isCreatingChat ? 'animate-pulse' : ''}`}>
        {/* Agent Dropdown */}
        {showAgentDropdown && agents.length > 0 && (
          <div className="absolute bottom-full left-4 mb-2 w-72 bg-[#0C0C0D] border border-border/30 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="p-2 max-h-64 overflow-y-auto">
              <div className="text-[11px] font-medium text-muted-foreground/60 px-2 py-1 mb-1 uppercase tracking-wider">Select AI Agent</div>
              {agents.map((agent) => (
                <button
                  type="button"
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setShowAgentDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-[13px] rounded-lg hover:bg-muted/30 transition-colors flex items-center gap-2 ${selectedAgent?.id === agent.id ? 'bg-blue-500/10 border border-blue-500/20' : ''}`}
                >
                  <div className="size-7 rounded-full bg-blue-500/20 flex items-center justify-center text-[11px] font-medium text-blue-400">
                    {agent.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="flex flex-col overflow-hidden flex-1">
                    <span className="font-medium text-foreground truncate">{agent.name}</span>
                    {agent.description && (
                      <span className="text-[11px] text-muted-foreground/60 truncate">{agent.description}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Textarea */}
        <div className="relative z-10 p-5">
          {isClient && input.length === 0 && (
            <div className="pointer-events-none absolute top-5 left-5 text-[15px] text-muted-foreground/50">
              {placeholderText}
            </div>
          )}

          <Textarea
            ref={textareaRef}
            placeholder=""
            value={input}
            onChange={handleInput}
            className="w-full min-h-[40px] max-h-[200px] overflow-y-auto resize-none text-[15px] bg-transparent border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 shadow-none text-foreground"
            rows={2}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (isLoading) {
                  toast.error("Please wait for the model to finish its response!");
                } else {
                  submitForm();
                }
              }
            }}
          />
        </div>

        {/* Bottom Toolbar - Blink Style */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/20">
          {/* Left Tools */}
          <div className="flex items-center gap-3 text-muted-foreground/70 text-[13px]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-foreground transition-colors p-1"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
            </button>

            {selectedAgent ? (
              <div className="flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[12px]">
                <div className="size-4 rounded-full bg-blue-500/30 flex items-center justify-center text-[9px] font-medium text-blue-400">
                  {selectedAgent.name.substring(0, 1).toUpperCase()}
                </div>
                <span className="text-blue-400 max-w-[100px] truncate">{selectedAgent.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedAgent(null)}
                  className="hover:text-foreground ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                disabled={agents.length === 0}
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Auto</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
            )}
          </div>

          {/* Right Tools */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 cursor-pointer hover:text-foreground transition-colors">
              <Globe className="h-3.5 w-3.5" />
              <span>Public</span>
            </div>
            <button
              type="button"
              className="text-muted-foreground/60 hover:text-foreground transition-colors p-1"
            >
              <Mic className="h-4 w-4" />
            </button>
            {isLoading ? (
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                onClick={(event) => {
                  event.preventDefault();
                  stop();
                }}
              >
                <StopIcon size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                onClick={(event) => {
                  event.preventDefault();
                  submitForm();
                }}
                disabled={input.length === 0 || uploadQueue.length > 0}
              >
                <ArrowUpIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggestion Pills - Blink Style */}
      {messages.length === 0 && attachments.length === 0 && uploadQueue.length === 0 && (
        <div className="flex flex-col items-center gap-3 mt-2">
          <p className="text-[12px] text-muted-foreground/60">Not sure where to start? Try one of these:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestedActions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                type="button"
                onClick={() => setInput(action.action)}
                className="flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/20 px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
              >
                <action.icon className="h-3 w-3" />
                <span>{action.title}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
