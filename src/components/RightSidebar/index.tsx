import React, { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import RightSidebarTabs, { TabId } from "./RightSidebarTabs";
import LiveFeedPanel from "./LiveFeedPanel";
import DocumentsPanel from "./DocumentsPanel";

type RightSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
  selectedDocumentId: Id<"documents"> | null;
  onSelectDocument: (id: Id<"documents"> | null) => void;
  onPreviewDocument: (id: Id<"documents">) => void;
};

const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen = false,
  onClose,
  selectedDocumentId,
  onSelectDocument,
  onPreviewDocument,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("live-feed");

  return (
    <aside
      className={`[grid-area:right-sidebar] sidebar-drawer sidebar-drawer--right bg-white border-l border-border flex flex-col overflow-hidden ${isOpen ? "is-open" : ""}`}
      aria-label="Right sidebar"
    >
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div className="text-[11px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[var(--accent-green)] rounded-full" />
          {activeTab === "live-feed" ? "LIVE FEED" : "DOCUMENTS"}
        </div>
        <button
          type="button"
          className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-accent transition-colors"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <RightSidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "live-feed" ? (
        <LiveFeedPanel />
      ) : (
        <DocumentsPanel
          selectedDocumentId={selectedDocumentId}
          onSelectDocument={onSelectDocument}
          onPreviewDocument={onPreviewDocument}
        />
      )}

      <div className="p-3 flex items-center justify-center gap-2 text-[10px] font-bold text-[var(--accent-green)] bg-[#f8f9fa] border-t border-border">
        <span className="w-1.5 h-1.5 bg-[var(--accent-green)] rounded-full" />
        LIVE
      </div>
    </aside>
  );
};

export default RightSidebar;
