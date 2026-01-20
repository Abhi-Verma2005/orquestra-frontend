"use client";

import { Attachment, ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Copy, RotateCcw, ChevronDown } from "lucide-react";
import { ReactNode, useEffect, useRef, useCallback, useMemo, useState } from "react";

import { BotIcon, UserIcon } from "@/components/custom/icons";
import Logo from "@/components/custom/logo";
import { PreviewAttachment } from "@/components/custom/preview-attachment";
import { Weather } from "@/components/custom/weather";
import TextShimmer from "@/components/forgeui/text-shimmer";
import CartManagementResults from "@/components/oms/cart-management-results";
import { PublishersResults } from "@/components/publishers/publishers-results";
import { ToolSummaryCard } from "@/components/tools";
import { ToolInvocationItem } from "@/components/tools/use-tool-invocation";
import { useCart } from "@/contexts/cart-context";
import { useChatUIState } from "@/contexts/chat-ui-state-context";
import { useSplitScreen } from "@/contexts/SplitScreenProvider";

import { Markdown } from "./Markdown";
import { ToolInvocationCard } from "./ToolInvocationCard";

// Helper function to get dynamic loading text based on active tools
const getLoadingText = (loadingTools?: Set<string>): string => {
  if (!loadingTools || loadingTools.size === 0) {
    return "Thinking...";
  }

  // Get the first active tool name
  const toolName = Array.from(loadingTools)[0];

  // Map tool names to appropriate loading messages
  const toolMessages: Record<string, string> = {
    browsePublishers: "Fetching publishers...",
    getWeather: "Fetching weather...",
    displayOrders: "Fetching orders...",
    getPublisherDetails: "Fetching publisher details...",
    addToCart: "Adding to cart...",
    removeFromCart: "Removing from cart...",
    viewCart: "Loading cart...",
    clearCart: "Clearing cart...",
    updateCartItemQuantity: "Updating cart...",
    collectPublisherFilters: "Collecting filters...",
    createExecutionPlan: "Creating plan...",
    updatePlanProgress: "Updating plan...",
  };

  return toolMessages[toolName] || "Thinking...";
};

export const Message = ({
  chatId,
  role,
  content,
  toolInvocations,
  attachments,
  onRegenerate,
  isLastMessage = false,
  isGenerating = false,
  onAppendMessage,
  loadingTools,
  name,
  currentUserId,
  currentUserDisplayName,
}: {
  chatId: string;
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
  attachments?: Array<Attachment>;
  onRegenerate?: () => void;
  isLastMessage?: boolean;
  isGenerating?: boolean;
  onAppendMessage?: (message: { role: 'user'; content: string }) => Promise<string | null | undefined>;
  loadingTools?: Set<string>;
  name?: string; // Internal sender identifier (usually user ID in group messages)
  currentUserId?: string;
  currentUserDisplayName?: string; // What to show for the current user in the UI
}) => {
  const { setRightPanelContent, closeRightPanel } = useSplitScreen();
  const { addItem, removeItem, getCartItemIds, state: cartState, clearCart } = useCart();

  // Use centralized UI state for real-time streaming updates (only for last message)
  const {
    isThinking,
    isExecutingTool,
    executingTools,
    currentMessageToolInvocations, // Use message-specific invocations instead of all
    uiState,
  } = useChatUIState();

  const processedToolCalls = useRef<Set<string>>(new Set());
  const openedToolCalls = useRef<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  // Determine actual state: use context state for last message, props for historical messages
  const actualIsGenerating = isLastMessage ? (isThinking || isExecutingTool || isGenerating) : isGenerating;
  const actualLoadingTools = isLastMessage ? executingTools : loadingTools;


  // Filter collection state
  const [collectedFilters, setCollectedFilters] = useState<{
    priceRange?: { min: number; max: number };
    drRange?: { minDR: number; maxDR: number; minDA: number; maxDA: number };
  }>({});

  // Copy functionality
  const handleCopy = useCallback(async () => {
    if (typeof content === 'string') {
      try {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  }, [content]);

  // Feedback handlers
  const handleThumbsUp = useCallback(() => {
    setFeedback(prev => prev === 'up' ? null : 'up');
  }, []);

  const handleThumbsDown = useCallback(() => {
    setFeedback(prev => prev === 'down' ? null : 'down');
  }, []);


  // Function to handle "Done Adding to Cart" button click
  // Function to trigger AI to continue filter collection
  const triggerFilterCollectionStep = useCallback(async (step: string, filters: any) => {
    try {
      const message = `I've set my ${step === 'price' ? 'price range' : 'DR/DA ranges'}. Please continue with the next step in the filter collection process. Current filters: ${JSON.stringify(filters)}`;
      await onAppendMessage?.({ role: 'user', content: message });
    } catch (error) {
      console.error('Error triggering filter collection step:', error);
    }
  }, [onAppendMessage]);

  // Function to trigger final browse publishers call
  const triggerFinalBrowseCall = useCallback(async (filters: any) => {
    try {
      const message = `Perfect! I've completed setting up all my filters. Please now browse publishers with these filters: ${JSON.stringify(filters)}`;
      await onAppendMessage?.({ role: 'user', content: message });
    } catch (error) {
      console.error('Error triggering final browse call:', error);
    }
  }, [onAppendMessage]);

  // Filter collection handlers
  const handlePriceRangeConfirm = useCallback((priceRange: { min: number; max: number }) => {
    const newFilters = { ...collectedFilters, priceRange };
    setCollectedFilters(newFilters);
    // Trigger next step - DR range collection
    triggerFilterCollectionStep("dr", newFilters);
  }, [collectedFilters, triggerFilterCollectionStep]);

  const handlePriceRangeSkip = useCallback(() => {
    // Trigger next step - DR range collection
    triggerFilterCollectionStep("dr", collectedFilters);
  }, [collectedFilters, triggerFilterCollectionStep]);

  const handleDRRangeConfirm = useCallback((drRange: { minDR: number; maxDR: number; minDA: number; maxDA: number }) => {
    const newFilters = { ...collectedFilters, drRange };
    setCollectedFilters(newFilters);
    // Trigger final browse publishers call with proper filter format
    const browseFilters = {
      minDR: drRange.minDR,
      maxDR: drRange.maxDR,
      minDA: drRange.minDA,
      maxDA: drRange.maxDA,
      ...(collectedFilters.priceRange && {
        minPrice: collectedFilters.priceRange.min,
        maxPrice: collectedFilters.priceRange.max
      })
    };
    triggerFinalBrowseCall(browseFilters);
  }, [collectedFilters, triggerFinalBrowseCall]);

  const handleDRRangeSkip = useCallback(() => {
    // Trigger final browse publishers call with available filters
    const browseFilters = {
      ...(collectedFilters.priceRange && {
        minPrice: collectedFilters.priceRange.min,
        maxPrice: collectedFilters.priceRange.max
      })
    };
    triggerFinalBrowseCall(browseFilters);
  }, [collectedFilters, triggerFinalBrowseCall]);


  const handleDoneAddingToCart = useCallback(() => {
    if (cartState.items.length === 0) return;

    // Show cart summary
    const cartSummary = (
      <div className="p-4 space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-200 text-sm font-medium">
            Cart is ready! Payment processing has been removed.
          </p>
        </div>
      </div>
    );

    setRightPanelContent(cartSummary);
  }, [cartState.items, setRightPanelContent, clearCart, closeRightPanel]);

  // Function to get component and show in right panel
  const showInRightPanel = useCallback((toolName: string, result: any, key?: string) => {
    let component = null;

    switch (toolName) {
      case "getWeather":
        component = <Weather weatherAtLocation={result} />;
        break;
      case "browsePublishers":
        component = (
          <PublishersResults
            results={result}
            onAddToCart={(publisher) => {
              addItem({
                id: publisher.id,
                type: "publisher",
                name: publisher.websiteName,
                price: publisher.pricing.base,
                quantity: 1,
                addedAt: new Date(),
                metadata: {
                  publisherId: publisher.id,
                  website: publisher.website,
                  niche: publisher.niche,
                  dr: publisher.authority.dr,
                  da: publisher.authority.da
                }
              });
            }}
            onRemoveFromCart={(publisherId) => {
              removeItem(publisherId);
            }}
            cartItems={getCartItemIds()}
          />
        );
        break;
      case "getPublisherDetails":
        component = (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Publisher Details</h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        );
        break;
      case "addToCart":
      case "removeFromCart":
      case "viewCart":
      case "clearCart":
      case "updateCartItemQuantity":
        component = (
          <CartManagementResults
            data={result}
            onDoneAddingToCart={handleDoneAddingToCart}
          />
        );
        break;
      default:
        component = (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Tool Result: {toolName}</h3>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        );
    }

    if (component) {
      // Wrap with a key to force remount when switching from loading -> result
      const wrapped = <div key={key || `${toolName}-content`}>{component}</div>;
      setRightPanelContent(wrapped);
    }
  }, [setRightPanelContent, addItem, removeItem, getCartItemIds, handleDoneAddingToCart, closeRightPanel]);

  // Auto-display completed tool results
  const toolStateSignature = useMemo(() => {
    if (!toolInvocations || toolInvocations.length === 0) return "";
    return toolInvocations.map((i) => `${i.toolCallId}:${i.state}`).join("|");
  }, [toolInvocations]);

  useEffect(() => {
    if (!toolInvocations || toolInvocations.length === 0) return;

    toolInvocations.forEach((toolInvocation) => {
      const { toolName, toolCallId, state } = toolInvocation;

      // When a tool call starts, just track it but don't open the sidebar yet
      if (state === "call" && !openedToolCalls.current.has(toolCallId)) {
        openedToolCalls.current.add(toolCallId);
      }

      // When the tool returns a result, open the sidebar and show the content
      if (state === "result" && !processedToolCalls.current.has(toolCallId)) {
        const { result } = toolInvocation as any;

        // Handle collectPublisherFilters inline (embedded), don't open sidebar
        if (toolName === "collectPublisherFilters") {
          // Don't open sidebar for filter collection - handled in result state
        } else {
          showInRightPanel(toolName, result, `result-${toolCallId}`);
        }

        processedToolCalls.current.add(toolCallId);
        openedToolCalls.current.delete(toolCallId);
      }
    });
  }, [toolStateSignature, toolInvocations, showInRightPanel, setRightPanelContent]);

  return (
    <motion.div
      className={`group flex flex-row gap-4 px-4 w-full max-w-[650px]`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className={`size-[24px] border border-border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-muted-foreground relative ${role === "assistant" && actualIsGenerating ? 'animate-[stream-pulse_2s_ease-in-out_infinite]' : ''
        }`}>
        {role === "assistant" ? (
          <Logo href="#" size={16} />
        ) : (
          <UserIcon />
        )}
        {/* Removed blue dot indicator over AI icon while generating */}
      </div>

      <div className="flex flex-col gap-2 w-full">
        {/* Show user name for user messages in group chats */}
        {role === "user" && (() => {
          // Derive a display label:
          // - For the current user, prefer a friendly display name (username / email)
          // - For others, fall back to the raw name value
          if (!name) return null;

          const isCurrentUser = currentUserId && name === currentUserId;
          const label = isCurrentUser
            ? (currentUserDisplayName || name)
            : name;

          if (!label) return null;

          return (
            <div className="text-xs text-muted-foreground font-medium mb-1">
              {label}
            </div>
          );
        })()}

        {/* Show system message styling */}
        {role === "system" && (
          <div className="text-xs text-muted-foreground italic mb-1">
            {typeof content === "string" ? content : "System message"}
          </div>
        )}

        {/* Show dynamic shimmer when generating but no content yet */}
        {role === "assistant" && actualIsGenerating && (!content || (typeof content === "string" && content.trim() === "")) && (
          <div className="w-full max-w-sm mb-4">
            <ToolSummaryCard
              title={getLoadingText(actualLoadingTools)}
              loading={true}
            >
              <TextShimmer className="text-xs" duration={1.5} repeatDelay={0.5}>
                Processing your request...
              </TextShimmer>
            </ToolSummaryCard>
          </div>
        )}

        {/* Tool Invocations - Show real-time for last message, historical for others - Show BEFORE content */}
        {(() => {
          // For the last message during streaming, show real-time invocations from context
          // Using currentMessageToolInvocations which only contains invocations for THIS message
          if (isLastMessage && role === "assistant" && currentMessageToolInvocations.length > 0) {
            return (
              <div className="flex flex-col gap-3 mb-4">
                {currentMessageToolInvocations.map((invocation) => (
                  <ToolInvocationCard key={invocation.id} invocation={invocation} />
                ))}
              </div>
            );
          }

          // For historical messages or completed messages, show saved tool invocations
          if (toolInvocations && toolInvocations.length > 0) {
            return (
              <div className="flex flex-col gap-3 mb-4">
                {toolInvocations.map((toolInvocation) => {
                  const { toolName } = toolInvocation;
                  const isLoading = loadingTools?.has(toolName) ?? false;

                  // Tools that need special interactive handlers (use old ToolInvocationItem)
                  const needsSpecialHandling = [
                    "collectPublisherFilters",
                    "createExecutionPlan",
                    "updatePlanProgress",
                  ].includes(toolName);

                  // Use new card component for simple tools like render_content
                  if (!needsSpecialHandling) {
                    // Convert old format to new ToolInvocation format
                    // If there's a result OR state is "result", show as complete
                    // This handles cases where state wasn't properly updated but result exists
                    const isComplete = toolInvocation.state === "result" || (toolInvocation as any).result != null;
                    const cardInvocation = {
                      id: toolInvocation.toolCallId,
                      name: toolName,
                      state: (isComplete ? "complete" : "loading") as "loading" | "complete",
                      args: toolInvocation.args,
                      result: (toolInvocation as any).result,
                      timestamp: Date.now(),
                    };

                    return (
                      <ToolInvocationCard
                        key={toolInvocation.toolCallId}
                        invocation={cardInvocation}
                      />
                    );
                  }

                  // Use old component for tools that need special handlers
                  const additionalProps: Record<string, unknown> = {};

                  // Filter renderer needs specific handlers
                  if (toolName === "collectPublisherFilters") {
                    additionalProps.onPriceRangeConfirm = handlePriceRangeConfirm;
                    additionalProps.onPriceRangeSkip = handlePriceRangeSkip;
                    additionalProps.onDRRangeConfirm = handleDRRangeConfirm;
                    additionalProps.onDRRangeSkip = handleDRRangeSkip;
                    additionalProps.onFinalBrowseCall = triggerFinalBrowseCall;
                  }

                  // Plan renderer needs chatId and append
                  if (toolName === "createExecutionPlan" || toolName === "updatePlanProgress") {
                    additionalProps.chatId = chatId;
                    additionalProps.onAppendMessage = onAppendMessage;
                  }

                  return (
                    <ToolInvocationItem
                      key={toolInvocation.toolCallId}
                      toolInvocation={toolInvocation}
                      loading={isLoading}
                      onExpand={showInRightPanel}
                      additionalProps={additionalProps}
                    />
                  );
                })}
              </div>
            );
          }

          return null;
        })()}

        {/* Show content when it exists (skip for system messages, they're shown above) */}
        {content && typeof content === "string" && content.trim() !== "" && role !== "system" && (
          <div className={`text-foreground flex flex-col gap-4 relative ${content.trim().startsWith("Error:") ? "error-message" : ""
            }`}>
            <div className={`${actualIsGenerating ? 'streaming-content' : ''} ${content.trim().startsWith("Error:")
                ? "bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 dark:border-red-500/40 rounded-lg p-3"
                : ""
              }`}>
              <div className={content.trim().startsWith("Error:") ? "text-red-600 dark:text-red-400" : ""}>
                <Markdown>{content}</Markdown>
              </div>
            </div>

            {/* Typing cursor - only show during streaming */}
            {actualIsGenerating && (
              <span
                className="absolute bottom-0 right-0 inline-block w-0.5 h-5 bg-primary animate-[typing-cursor-optimized_1s_ease-in-out_infinite]"
                aria-hidden="true"
              />
            )}
          </div>
        )}

        {attachments && (
          <div className="flex flex-col gap-2">
            {attachments.map((attachment) => (
              <PreviewAttachment key={attachment.url} attachment={attachment} />
            ))}
          </div>
        )}

        {/* Response Action Buttons - Only show for assistant messages when response is complete */}
        {role === "assistant" && content && typeof content === "string" && !actualIsGenerating && (
          <div className={`flex items-center gap-1 mt-2 text-muted-foreground transition-opacity duration-200 ${isLastMessage ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
            <button
              onClick={handleThumbsUp}
              className={`p-1 rounded hover:bg-muted transition-colors ${feedback === 'up' ? 'text-green-500' : ''
                }`}
              title="Thumbs up"
            >
              <ThumbsUp size={14} />
            </button>
            <button
              onClick={handleThumbsDown}
              className={`p-1 rounded hover:bg-muted transition-colors ${feedback === 'down' ? 'text-red-500' : ''
                }`}
              title="Thumbs down"
            >
              <ThumbsDown size={14} />
            </button>
            <button
              onClick={handleCopy}
              className={`p-1 rounded hover:bg-muted transition-colors ${copied ? 'text-green-500' : ''
                }`}
              title={copied ? "Copied!" : "Copy"}
            >
              <Copy size={14} />
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1 rounded hover:bg-muted transition-colors"
                title="Regenerate response"
              >
                <RotateCcw size={14} />
              </button>
            )}
            <div className="w-px h-4 bg-border mx-1" />
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Personalized with Memory</span>
              <ChevronDown size={12} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
