import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { IconX, IconCheck, IconUser, IconTag, IconMessage, IconClock, IconFileText, IconCopy, IconCalendar, IconArchive } from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";

interface TaskDetailPanelProps {
  taskId: Id<"tasks"> | null;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  inbox: "var(--text-subtle)",
  assigned: "var(--accent-orange)",
  in_progress: "var(--accent-blue)",
  review: "var(--text-main)",
  done: "var(--accent-green)",
  archived: "var(--text-subtle)",
};

const statusLabels: Record<string, string> = {
  inbox: "INBOX",
  assigned: "ASSIGNED",
  in_progress: "IN PROGRESS",
  review: "REVIEW",
  done: "DONE",
  archived: "ARCHIVED",
};

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ taskId, onClose }) => {
  const tasks = useQuery(api.queries.listTasks);
  const agents = useQuery(api.queries.listAgents);
  const resources = useQuery(api.documents.listByTask, taskId ? { taskId } : "skip");
  const activities = useQuery(api.queries.listActivities, taskId ? { taskId } : "skip");
  const messages = useQuery(api.queries.listMessages, taskId ? { taskId } : "skip");

  const updateStatus = useMutation(api.tasks.updateStatus);
  const updateAssignees = useMutation(api.tasks.updateAssignees);
  const updateTask = useMutation(api.tasks.updateTask);
  const archiveTask = useMutation(api.tasks.archiveTask);
  const sendMessage = useMutation(api.messages.send);
  const createDocument = useMutation(api.documents.create);

  const task = tasks?.find((t) => t._id === taskId);
  const currentUserAgent = agents?.find(a => a.name === "Manish");
  
  const [description, setDescription] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<Array<Id<"documents">>>([]);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState("note");
  const [newDocPath, setNewDocPath] = useState("");
  const [newDocContent, setNewDocContent] = useState("");

  useEffect(() => {
    if (task) {
      setDescription(task.description);
    }
  }, [task]);

  if (!taskId) return null;
  if (!task) return null; // Loading or not found

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (currentUserAgent) {
        updateStatus({ taskId: task._id, status: e.target.value as any, agentId: currentUserAgent._id });
    }
  };

  const handleAssigneeToggle = (agentId: Id<"agents">) => {
    if (!currentUserAgent) return;
    const currentAssignees = task.assigneeIds || [];
    const isAssigned = currentAssignees.includes(agentId);
    
    let newAssignees;
    if (isAssigned) {
      newAssignees = currentAssignees.filter(id => id !== agentId);
    } else {
      newAssignees = [...currentAssignees, agentId];
    }
    updateAssignees({ taskId: task._id, assigneeIds: newAssignees, agentId: currentUserAgent._id });
  };

  const saveDescription = () => {
    if (currentUserAgent) {
        updateTask({ taskId: task._id, description, agentId: currentUserAgent._id });
        setIsEditingDesc(false);
    }
  };

type Resource = NonNullable<typeof resources>[number];

const docsById = useMemo(() => {
  const map = new Map<string, Resource>();
  (resources ?? []).forEach((doc) => {
    map.set(doc._id, doc);
  });
  return map;
}, [resources]);

  const sortedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].sort((a, b) => a._creationTime - b._creationTime);
  }, [messages]);

  const toggleAttachment = (docId: Id<"documents">) => {
    setSelectedAttachmentIds((prev) => {
      if (prev.includes(docId)) {
        return prev.filter((id) => id !== docId);
      }
      return [...prev, docId];
    });
  };

  const sendComment = async () => {
    if (!currentUserAgent) return;
    const trimmed = commentText.trim();
    if (!trimmed) return;
    await sendMessage({
      taskId: task._id,
      agentId: currentUserAgent._id,
      content: trimmed,
      attachments: selectedAttachmentIds,
    });
    setCommentText("");
    setSelectedAttachmentIds([]);
  };

  const resetNewDocForm = () => {
    setNewDocTitle("");
    setNewDocType("note");
    setNewDocPath("");
    setNewDocContent("");
  };

  const submitNewDoc = async () => {
    if (!currentUserAgent) return;
    const trimmedTitle = newDocTitle.trim();
    if (!trimmedTitle) return;
    const docId = await createDocument({
      title: trimmedTitle,
      type: newDocType.trim() || "note",
      content: newDocContent.trim(),
      path: newDocPath.trim() || undefined,
      taskId: task._id,
      agentId: currentUserAgent._id,
    });
    setSelectedAttachmentIds((prev) => [...prev, docId]);
    resetNewDocForm();
    setIsAddingDoc(false);
  };

  const renderAvatar = (
    agent?: { name: string; avatar?: string } | string
  ) => {
    if (!agent) return <IconUser size={10} />;

    if (typeof agent === "string") {
      const avatarUrl = agent;
      if (avatarUrl && (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:"))) {
        return <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" />;
      }
      return (
        <span className="text-[9px] font-bold flex items-center justify-center h-full w-full leading-none text-muted-foreground bg-muted">
          {avatarUrl.slice(0, 2).toUpperCase()}
        </span>
      );
    }

    const avatarUrl = agent.avatar;
    if (avatarUrl && (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:"))) {
      return <img src={avatarUrl} className="w-full h-full object-cover" alt={agent.name} />;
    }

    const initials = agent.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return (
      <span className="text-[9px] font-bold flex items-center justify-center h-full w-full leading-none text-muted-foreground bg-muted">
        {initials}
      </span>
    );
  };

  const formatCreationDate = (ms: number) => {
    return new Date(ms).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const lastUpdatedActivity = activities?.[0];
  const lastUpdated = lastUpdatedActivity ? lastUpdatedActivity._creationTime : null;

  return (
    <div className="fixed inset-y-0 right-0 w-[380px] bg-white border-l border-border shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-[#f8f9fa]">
        <div className="flex items-center gap-2">
          <span 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColors[task.status] || "gray" }}
          />
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            {task._id.slice(-6)}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors"
        >
          <IconX size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        
        {/* Title */}
        <div>
          <h2 className="text-lg font-bold text-foreground leading-tight mb-1.5">
            {task.title}
          </h2>
          <div className="flex gap-2 mb-3">
            {task.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 bg-muted rounded font-medium text-muted-foreground flex items-center gap-1">
                <IconTag size={10} /> {tag}
              </span>
            ))}
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2">
            {task.status !== 'done' && task.status !== 'archived' && (
              <button
                  onClick={() => currentUserAgent && updateStatus({ taskId: task._id, status: 'done', agentId: currentUserAgent._id })}
                  disabled={!currentUserAgent}
                  className={`flex-1 py-1.5 bg-[var(--accent-green)] text-white rounded text-xs font-medium flex items-center justify-center gap-2 transition-opacity shadow-sm ${!currentUserAgent ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                  title={!currentUserAgent ? "User agent not found" : "Mark as Done"}
              >
                  <IconCheck size={16} />
                  Mark as Done
              </button>
            )}
            {task.status !== 'archived' && (
              <button
                  onClick={() => currentUserAgent && archiveTask({ taskId: task._id, agentId: currentUserAgent._id })}
                  disabled={!currentUserAgent}
                  className={`${task.status === 'done' ? 'flex-1' : ''} py-1.5 px-3 bg-muted text-muted-foreground rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow-sm ${!currentUserAgent ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#e5e5e5]'}`}
                  title={!currentUserAgent ? "User agent not found" : "Archive Task"}
              >
                  <IconArchive size={16} />
                  Archive
              </button>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
          <select
            value={task.status}
            onChange={handleStatusChange}
            disabled={!currentUserAgent}
            className="w-full p-1.5 text-sm border border-border rounded bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)] disabled:opacity-50"
          >
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-1 group">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
            {!isEditingDesc && currentUserAgent && (
              <button 
                onClick={() => setIsEditingDesc(true)}
                className="text-[10px] text-[var(--accent-blue)] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Edit
              </button>
            )}
          </div>
          
          {isEditingDesc ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[90px] p-2.5 text-sm border border-border rounded bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setIsEditingDesc(false)}
                  className="px-3 py-1 text-xs text-muted-foreground hover:bg-muted rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveDescription}
                  className="px-3 py-1 text-xs bg-foreground text-secondary rounded hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          )}
        </div>

        {/* Assignees */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Assignees</label>
          <div className="flex flex-wrap gap-1.5">
            {task.assigneeIds?.map(id => {
              const agent = agents?.find(a => a._id === id);
              return (
                <div key={id} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-border rounded-full shadow-sm">
                  <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                     {renderAvatar(agent)}
                  </div>
                  <span className="text-xs font-medium text-foreground">{agent?.name || "Unknown"}</span>
                  <button 
                    onClick={() => handleAssigneeToggle(id)} 
                    disabled={!currentUserAgent}
                    className="hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconX size={12} />
                  </button>
                </div>
              );
            })}
            <div className="relative group">
              <button
                disabled={!currentUserAgent}
                className="flex items-center gap-1 px-2 py-1 bg-muted border border-transparent rounded-full text-[11px] text-muted-foreground hover:bg-white hover:border-border transition-all disabled:opacity-50"
              >
                <span>+ Add</span>
              </button>
              
              {/* Dropdown for adding agents - simplified for now */}
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-border shadow-lg rounded-lg hidden group-hover:block z-10 p-1">
                 {agents?.filter(a => !task.assigneeIds?.includes(a._id)).map(agent => (
                   <button 
                    key={agent._id}
                    onClick={() => handleAssigneeToggle(agent._id)}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted rounded flex items-center gap-2"
                   >
                     <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {renderAvatar(agent)}
                     </div>
                     {agent.name}
                   </button>
                 ))}
                 {agents?.filter(a => !task.assigneeIds?.includes(a._id)).length === 0 && (
                   <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">No available agents</div>
                 )}
              </div>
            </div>
          </div>
        </div>

        {/* Resources / Deliverables */}
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Resources / Deliverables</label>
                <button
                  onClick={() => setIsAddingDoc((prev) => !prev)}
                  disabled={!currentUserAgent}
                  className="text-[10px] text-[var(--accent-blue)] disabled:opacity-50 hover:underline"
                >
                  {isAddingDoc ? "Cancel" : "+ Add Resource"}
                </button>
            </div>
            
            {isAddingDoc && (
                <div className="space-y-2 p-2.5 bg-muted/40 border border-border rounded animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex flex-col gap-2">
                    <input
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      placeholder="Document title"
                      className="w-full p-2 text-xs border border-border rounded bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <input
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value)}
                        placeholder="Type (note, spec, link)"
                        className="flex-1 p-2 text-xs border border-border rounded bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                      />
                      <input
                        value={newDocPath}
                        onChange={(e) => setNewDocPath(e.target.value)}
                        placeholder="Path (optional)"
                        className="flex-1 p-2 text-xs border border-border rounded bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                      />
                    </div>
                    <textarea
                      value={newDocContent}
                      onChange={(e) => setNewDocContent(e.target.value)}
                      placeholder="Content (optional)"
                      className="w-full min-h-[70px] p-2 text-xs border border-border rounded bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={submitNewDoc}
                        disabled={!currentUserAgent || !newDocTitle.trim()}
                        className="px-3 py-1 text-[10px] bg-foreground text-secondary rounded hover:opacity-90 disabled:opacity-50"
                      >
                        Save Resource
                      </button>
                    </div>
                  </div>
                </div>
            )}

            {resources && resources.length > 0 ? (
                <div className="space-y-1">
                    {resources.map((doc) => (
                        <div key={doc._id} className="flex items-center justify-between p-1.5 bg-white border border-border rounded text-sm hover:bg-muted transition-colors cursor-pointer group">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <IconFileText size={14} className="text-muted-foreground shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <span className="truncate text-foreground font-medium">{doc.title}</span>
                                    {doc.path && <span className="text-[10px] text-muted-foreground truncate font-mono">{doc.path}</span>}
                                </div>
                            </div>
                            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground uppercase self-start mt-0.5">{doc.type}</span>
                        </div>
                    ))}
                </div>
            ) : (
                !isAddingDoc && <div className="text-xs text-muted-foreground italic pl-1">No resources linked.</div>
            )}
        </div>

        {/* Comments */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Comments</label>
          </div>

          {sortedMessages.length === 0 && (
            <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded p-3">
              No comments yet. Start the conversation.
            </div>
          )}

          {sortedMessages.length > 0 && (
            <div className="space-y-2.5">
              {sortedMessages.map((msg) => (
                <div key={msg._id} className="flex gap-2 p-2.5 bg-white border border-border rounded">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {renderAvatar({ name: msg.agentName, avatar: msg.agentAvatar })}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{msg.agentName}</span>
                      <span>{formatCreationDate(msg._creationTime)}</span>
                    </div>
                    <div className="text-sm text-foreground markdown-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.attachments?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.attachments.map((attachmentId) => {
                          const doc = docsById.get(attachmentId as string);
                          return (
                            <div
                              key={attachmentId}
                              className="text-[10px] px-2 py-0.5 bg-muted rounded border border-border text-muted-foreground flex items-center gap-1"
                            >
                              <IconFileText size={10} />
                              <span className="font-medium">{doc?.title || "Attachment"}</span>
                              {doc?.path && (
                                <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[120px]">
                                  {doc.path}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Attach existing resources */}
          {resources && resources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {resources.map((doc) => {
                const isSelected = selectedAttachmentIds.includes(doc._id);
                return (
                  <button
                    key={doc._id}
                    onClick={() => toggleAttachment(doc._id)}
                    disabled={!currentUserAgent}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      isSelected
                        ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                        : "bg-white text-muted-foreground border-border hover:bg-muted"
                    } disabled:opacity-50`}
                  >
                    {doc.title}
                  </button>
                );
              })}
            </div>
          )}

          {selectedAttachmentIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedAttachmentIds.map((id) => {
                const doc = docsById.get(id as string);
                return (
                  <div
                    key={id}
                    className="text-[10px] px-2 py-0.5 bg-secondary rounded text-muted-foreground flex items-center gap-1"
                  >
                    <IconFileText size={10} />
                    <span className="font-medium">{doc?.title || "Attachment"}</span>
                    <button
                      onClick={() => toggleAttachment(id)}
                      className="hover:text-foreground"
                      title="Remove attachment"
                    >
                      <IconX size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Form moved to Resources section */}

          <div className="space-y-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={currentUserAgent ? "Write a comment..." : "Sign in as an agent to comment"}
              disabled={!currentUserAgent}
              className="w-full min-h-[80px] p-2.5 text-sm border border-border rounded bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)] disabled:opacity-50"
            />
            <div className="flex justify-end">
              <button
                onClick={sendComment}
                disabled={!currentUserAgent || commentText.trim().length === 0}
                className="px-4 py-2 text-xs bg-[var(--accent-blue)] text-white rounded font-semibold hover:opacity-90 disabled:opacity-50"
              >
                Send Comment
              </button>
            </div>
          </div>
        </div>

         {/* Meta */}
         <div className="mt-auto pt-6 border-t border-border flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <IconClock size={12} />
                    <span>Created {formatCreationDate(task._creationTime)}</span>
                </div>
                {lastUpdated && (
                    <div className="flex items-center gap-2">
                         <IconCalendar size={12} />
                         <span>Updated {formatCreationDate(lastUpdated)}</span>
                    </div>
                )}
            </div>
            {task.startedAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                     <IconClock size={12} className="text-[var(--accent-green)]" />
                     <span>Started {formatCreationDate(task.startedAt)}</span>
                </div>
            )}
             <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <IconMessage size={12} />
                    <span>{messages?.length || 0} comments</span>
                </div>
                 <div 
                    className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors" 
                    onClick={() => {
                        navigator.clipboard.writeText(task._id);
                    }}
                    title="Copy Task ID"
                 >
                     <span>ID: {task._id.slice(-6)}</span>
                     <IconCopy size={12} />
                </div>
            </div>
         </div>

      </div>
    </div>
  );
};

export default TaskDetailPanel;
