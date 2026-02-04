import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

const filters = [
  { id: "all", label: "All" },
  { id: "tasks", label: "Tasks" },
  { id: "comments", label: "Comments" },
  { id: "decisions", label: "Decisions" },
  { id: "docs", label: "Docs" },
  { id: "status", label: "Status" },
];

const LiveFeedPanel: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedAgentId, setSelectedAgentId] = useState<
    Id<"agents"> | undefined
  >(undefined);

  const activities = useQuery(api.queries.listActivities, {
    type: selectedType === "all" ? undefined : selectedType,
    agentId: selectedAgentId,
  });
  const agents = useQuery(api.queries.listAgents);

  if (activities === undefined || agents === undefined) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden animate-pulse">
        <div className="flex-1 p-4 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <div
              key={f.id}
              onClick={() => setSelectedType(f.id)}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border border-border cursor-pointer flex items-center gap-1 transition-colors ${
                selectedType === f.id
                  ? "bg-[var(--accent-orange)] text-white border-[var(--accent-orange)]"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <div
            onClick={() => setSelectedAgentId(undefined)}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
              selectedAgentId === undefined
                ? "border-[var(--accent-orange)] text-[var(--accent-orange)] bg-white"
                : "border-border bg-white text-muted-foreground hover:bg-muted/50"
            }`}
          >
            All Agents
          </div>
          {agents.slice(0, 8).map((a) => (
            <div
              key={a._id}
              onClick={() => setSelectedAgentId(a._id)}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer flex items-center gap-1 transition-colors ${
                selectedAgentId === a._id
                  ? "border-[var(--accent-orange)] text-[var(--accent-orange)] bg-white"
                  : "border-border bg-white text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {a.name}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {activities.map((item) => (
          <div
            key={item._id}
            className="flex gap-3 p-3 bg-secondary border border-border rounded-lg"
          >
            <div className="w-1.5 h-1.5 bg-[var(--accent-orange)] rounded-full mt-1.5 shrink-0" />
            <div className="text-xs leading-tight text-foreground">
              <span className="font-bold text-[var(--accent-orange)]">
                {item.agentName}
              </span>{" "}
              {item.message}
              <div className="text-[10px] text-muted-foreground mt-1">
                just now
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveFeedPanel;
