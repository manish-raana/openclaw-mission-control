import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Markdown from "react-markdown";

type DocumentPreviewTrayProps = {
  documentId: Id<"documents">;
  onClose: () => void;
};

const DocumentPreviewTray: React.FC<DocumentPreviewTrayProps> = ({
  documentId,
  onClose,
}) => {
  const documentContext = useQuery(api.documents.getWithContext, {
    documentId,
  });

  if (!documentContext) {
    return (
      <div className="tray tray-preview is-open">
        <div className="p-4 animate-pulse">
          <div className="h-8 bg-muted rounded mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    const { type, content } = documentContext;

    // Image - render from URL, data URI, or local file path
    if (type === "image") {
      let imgSrc: string | null = null;

      if (
        content.startsWith("http://") ||
        content.startsWith("https://") ||
        content.startsWith("data:")
      ) {
        imgSrc = content;
      } else if (content.startsWith("/")) {
        // Local file path — serve via Vite dev server
        imgSrc = `/api/local-file?path=${encodeURIComponent(content)}`;
      }

      if (imgSrc) {
        return (
          <div className="flex items-center justify-center p-4">
            <img
              src={imgSrc}
              alt={documentContext.title}
              className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
            />
          </div>
        );
      }
      return (
        <div className="p-4 text-center text-muted-foreground">
          <div className="text-4xl mb-2">IMG</div>
          <div className="text-sm">Image content preview not available</div>
        </div>
      );
    }

    // Code
    if (type === "code") {
      return (
        <div className="p-4">
          <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-lg overflow-x-auto text-xs leading-relaxed">
            <code>{content}</code>
          </pre>
        </div>
      );
    }

    // Markdown or Notes
    if (type === "markdown" || type === "note") {
      return (
        <div className="p-4 prose prose-sm max-w-none markdown-content">
          <Markdown>{content}</Markdown>
        </div>
      );
    }

    // Default - plain text
    return (
      <div className="p-4">
        <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
          {content}
        </pre>
      </div>
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "markdown":
        return "bg-blue-100 text-blue-700";
      case "code":
        return "bg-green-100 text-green-700";
      case "image":
        return "bg-purple-100 text-purple-700";
      case "note":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="tray tray-preview is-open">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Close preview tray"
            >
              ✕
            </button>
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground">
              PREVIEW
            </span>
          </div>
          <span
            className={`text-[10px] font-semibold px-2 py-1 rounded ${getTypeColor(documentContext.type)}`}
          >
            {documentContext.type.toUpperCase()}
          </span>
        </div>

        {/* Document title */}
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">
            {documentContext.title}
          </h3>
          {documentContext.path && (
            <div className="text-[10px] text-muted-foreground mt-1 font-mono truncate">
              {documentContext.path}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">{renderContent()}</div>

        {/* Footer with metadata */}
        <div className="px-4 py-2 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex items-center gap-4">
          {documentContext.agentName && (
            <div className="flex items-center gap-1">
              <span>Created by</span>
              <span className="text-[var(--accent-orange)] font-medium">
                {documentContext.agentName}
              </span>
            </div>
          )}
          {documentContext.taskTitle && (
            <div className="flex items-center gap-1 truncate">
              <span>Task:</span>
              <span className="font-medium truncate">
                {documentContext.taskTitle}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewTray;
