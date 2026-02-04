import React from "react";
import { Id } from "../../../convex/_generated/dataModel";
import ConversationTray from "./ConversationTray";
import DocumentPreviewTray from "./DocumentPreviewTray";

type TrayContainerProps = {
  selectedDocumentId: Id<"documents"> | null;
  showConversation: boolean;
  showPreview: boolean;
  onCloseConversation: () => void;
  onClosePreview: () => void;
  onOpenPreview: () => void;
};

const TrayContainer: React.FC<TrayContainerProps> = ({
  selectedDocumentId,
  showConversation,
  showPreview,
  onCloseConversation,
  onClosePreview,
  onOpenPreview,
}) => {
  if (!selectedDocumentId) return null;

  return (
    <div className="tray-container">
      {/* Backdrop for mobile */}
      {(showConversation || showPreview) && (
        <div
          className="tray-backdrop"
          onClick={() => {
            onClosePreview();
            onCloseConversation();
          }}
          aria-hidden="true"
        />
      )}

      {/* Preview tray - positioned further left */}
      {showPreview && (
        <DocumentPreviewTray
          documentId={selectedDocumentId}
          onClose={onClosePreview}
        />
      )}

      {/* Conversation tray - positioned next to sidebar */}
      {showConversation && (
        <ConversationTray
          documentId={selectedDocumentId}
          onClose={onCloseConversation}
          onOpenPreview={onOpenPreview}
        />
      )}
    </div>
  );
};

export default TrayContainer;
