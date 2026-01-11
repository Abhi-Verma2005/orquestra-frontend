"use client";

import { useSplitScreen } from "@/contexts/SplitScreenProvider";
import type { ToolInvocation } from "@/types/chat-ui-state";
import TextShimmer from "@/components/forgeui/text-shimmer";
import { ToolSummaryCard } from "@/components/tools/tool-summary-card";

interface ToolInvocationCardProps {
  invocation: ToolInvocation;
}

/**
 * Tool Invocation Card Component
 *
 * Displays visual representation of function calls:
 * - Loading shimmer when state='loading' and no data
 * - Populated card with data when available
 * - Clickable when state='complete' to show in sidebar
 */
export function ToolInvocationCard({ invocation }: ToolInvocationCardProps) {
  const { setRightPanelContent } = useSplitScreen();

  const handleClick = () => {
    if (invocation.state === 'complete') {
      // Open sidebar with tool details - pass ReactNode directly, not wrapped in object
      setRightPanelContent(
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Tool: {invocation.name}</h2>
          <div className="space-y-4">
            {invocation.args && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Arguments:</div>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                  {JSON.stringify(invocation.args, null, 2)}
                </pre>
              </div>
            )}
            {invocation.result && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Result:</div>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                  {JSON.stringify(invocation.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  // Get display title based on tool name
  const getToolTitle = (name: string): string => {
    const titleMap: Record<string, string> = {
      render_content: 'Rendering Content',
      get_user_info: 'Getting User Info',
      browsePublishers: 'Browsing Publishers',
      getWeather: 'Getting Weather',
      addToCart: 'Adding to Cart',
      viewCart: 'Viewing Cart',
      // Add more as needed
    };
    return titleMap[name] || name;
  };

  // Show loading shimmer if still loading (not complete)
  const isComplete = invocation.state === 'complete';
  const isLoading = !isComplete;
  
  // Show loading shimmer if loading and no args yet
  if (isLoading && !invocation.args) {
    return (
      <div className="w-full max-w-sm">
        <ToolSummaryCard
          title={getToolTitle(invocation.name)}
          loading={true}
        >
          <div className="space-y-2">
            {invocation.progressMessage && (
              <div className="text-xs text-muted-foreground">
                {invocation.progressMessage}
              </div>
            )}
            {invocation.progress !== undefined && (
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${invocation.progress}%` }}
                />
              </div>
            )}
            {!invocation.progressMessage && (
              <TextShimmer className="text-xs" duration={1.5} repeatDelay={0.5}>
                Executing...
              </TextShimmer>
            )}
          </div>
        </ToolSummaryCard>
      </div>
    );
  }

  // Show populated card with args (and maybe result)
  const renderContentArgs = invocation.args as { title?: string; content?: string };

  // Special rendering for render_content tool
  if (invocation.name === 'render_content' && renderContentArgs.title && renderContentArgs.content) {
    return (
      <div
        className={`w-full max-w-sm ${isComplete ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
        onClick={isComplete ? handleClick : undefined}
      >
        <ToolSummaryCard
          title={renderContentArgs.title}
          loading={!isComplete}
        >
          <div className="text-sm text-muted-foreground line-clamp-3">
            {renderContentArgs.content}
          </div>
          {isComplete && (
            <div className="text-xs text-primary mt-2">
              Click to view full content →
            </div>
          )}
        </ToolSummaryCard>
      </div>
    );
  }

  // Generic rendering for other tools
  return (
    <div
      className={`w-full max-w-sm ${isComplete ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={isComplete ? handleClick : undefined}
    >
      <ToolSummaryCard
        title={getToolTitle(invocation.name)}
        loading={!isComplete}
      >
        <div className="text-xs text-muted-foreground">
          {isComplete || invocation.result ? (
            <span className="text-green-600">✓ Completed</span>
          ) : invocation.args ? (
            <span>{Object.keys(invocation.args).length} parameter(s)</span>
          ) : (
            <span>Processing...</span>
          )}
        </div>
        {isComplete && (
          <div className="text-xs text-primary mt-2">
            Click to view details →
          </div>
        )}
      </ToolSummaryCard>
    </div>
  );
}
