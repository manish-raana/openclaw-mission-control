import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Markdown from "react-markdown";

type ConversationTrayProps = {
  documentId: Id<"documents">;
  onClose: () => void;
  onOpenPreview: () => void;
};

const ConversationTray: React.FC<ConversationTrayProps> = ({
  documentId,
  onClose,
  onOpenPreview,
}) => {
  const documentContext = useQuery(api.documents.getWithContext, {
    documentId,
  });

  if (!documentContext) {
    return (
      <div className="tray is-open">
        <div className="p-4 animate-pulse">
          <div className="h-8 bg-muted rounded mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tray is-open">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Close conversation tray"
            >
              ✕
            </button>
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground">
              CONTEXT
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenPreview}
            className="text-[10px] font-semibold px-3 py-1.5 rounded bg-[var(--accent-orange)] text-white hover:bg-[var(--accent-orange)]/90 transition-colors"
          >
            Open Preview
          </button>
        </div>

        {/* Document info */}
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {documentContext.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
            {documentContext.agentName && (
              <>
                <span className="text-[var(--accent-orange)] font-medium">
                  {documentContext.agentName}
                </span>
                <span>·</span>
              </>
            )}
            <span className="capitalize">{documentContext.type}</span>
            {documentContext.taskTitle && (
              <>
                <span>·</span>
                <span className="truncate">Task: {documentContext.taskTitle}</span>
              </>
            )}
          </div>
        </div>

        {/* Full conversation thread */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            {/* Original prompt */}
            {documentContext.taskDescription && (
              <>
                <div className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1">
                  PROMPT
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">👤</span>
                    <span className="text-xs font-semibold text-blue-700">
                      User
                    </span>
                  </div>
                  <div className="text-xs text-foreground leading-relaxed markdown-content">
                    <Markdown>{documentContext.taskDescription}</Markdown>
                  </div>
                </div>
              </>
            )}

            {/* Message thread */}
            {documentContext.conversationMessages.length > 0 && (
              <>
                <div className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1">
                  AGENT THREAD
                </div>
                {documentContext.conversationMessages.map((msg) => (
                  <div
                    key={msg._id}
                    className="p-3 bg-secondary border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {msg.agentAvatar && (
                        <span className="text-lg">{msg.agentAvatar}</span>
                      )}
                      <span className="text-xs font-semibold text-[var(--accent-orange)]">
                        {msg.agentName}
                      </span>
                    </div>
                    <div className="text-xs text-foreground leading-relaxed markdown-content">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* No content message */}
            {!documentContext.taskDescription &&
              documentContext.conversationMessages.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground text-sm">
                    No conversation history available
                  </div>
                  <div className="text-muted-foreground/60 text-xs mt-1">
                    This document was created without task context
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationTray;
