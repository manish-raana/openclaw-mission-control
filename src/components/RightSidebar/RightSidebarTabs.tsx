import React from "react";

export type TabId = "live-feed" | "documents";

type RightSidebarTabsProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

const RadarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" opacity="0.5" />
    <circle cx="12" cy="12" r="2" opacity="0.3" />
    <line x1="12" y1="2" x2="12" y2="22" opacity="0.3" />
    <line x1="2" y1="12" x2="22" y2="12" opacity="0.3" />
    <line x1="12" y1="12" x2="5" y2="5" strokeWidth="2" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
  </svg>
);

const tabs: { id: TabId; label: string; icon?: React.ReactNode }[] = [
  { id: "live-feed", label: "Live Feed", icon: <RadarIcon className="inline-block align-middle text-green-500" /> },
  { id: "documents", label: "Documents", icon: "📚" },
];

const RightSidebarTabs: React.FC<RightSidebarTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-4 py-3 text-[11px] font-bold tracking-widest transition-colors ${
            activeTab === tab.id
              ? "text-[var(--accent-orange)] border-b-2 border-[var(--accent-orange)] bg-white"
              : "text-muted-foreground hover:text-foreground bg-muted/30"
          }`}
        >
          {tab.icon && <span className="mr-1 text-base">{tab.icon}</span>}{tab.label.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default RightSidebarTabs;
