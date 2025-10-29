'use client';

import { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/lib/context/AppContext';
import RichTextEditor from '@/components/RichTextEditor';
import VersionHistory from '@/components/VersionHistory';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Save, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWebSocket } from '@/hooks/use-websocket';

export default function EditorView() {
  const { currentPage, currentUser, updatePage, currentProject } = useApp();
  const [content, setContent] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // WebSocket for real-time collaboration
  const { isConnected, remoteUsers, sendUpdate, sendPresence, sendCursor } = useWebSocket(
    currentPage?.id,
    currentUser,
    (message) => {
      // Handle realtime messages
      if (message.type === 'update' && message.changes?.content != null) {
        // Apply incoming content from other users
        setContent((prev) => {
          const next = message.changes.content;
          return next !== prev ? next : prev;
        });
        setHasUnsavedChanges(false);
      }
      if (message.type === 'cursor' && message.position) {
        // Presence/cursor list maintained by hook -> remoteUsers, so UI updates
      }
    }
  );

  useEffect(() => {
    if (currentPage) {
      setContent(currentPage.content || '');
      setHasUnsavedChanges(false);
      setLastSaved(currentPage.updatedAt);
    }
  }, [currentPage?.id]);

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !currentPage) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [content, hasUnsavedChanges]);

  const handleSave = useCallback(async () => {
    if (!currentPage || !hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      updatePage(currentPage.id, { content });
      setHasUnsavedChanges(false);
      setLastSaved(Date.now());
      toast.success('Changes saved');
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [currentPage, content, hasUnsavedChanges, updatePage]);

  const handleContentChange = useCallback(
    (newContent) => {
      setContent(newContent);
      setHasUnsavedChanges(true);
      
      // Broadcast changes to other users
      if (isConnected) {
        sendUpdate({ content: newContent });
      }
    },
    [isConnected, sendUpdate]
  );

  if (!currentPage) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No page selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a page from the sidebar or create a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{currentPage.title}</h2>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-xs">
                {isSaving ? 'Saving...' : 'Unsaved'}
              </Badge>
            )}
            {!hasUnsavedChanges && lastSaved && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Save className="h-3 w-3" />
                Saved {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Active collaborators */}
            {isConnected && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {remoteUsers.slice(0, 3).map((user) => (
                    <div
                      key={user.clientId}
                      className="h-8 w-8 rounded-full border-2 border-background flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: user.color }}
                      title={user.name}
                    >
                      {user.name?.charAt(0)}
                    </div>
                  ))}
                  {remoteUsers.length > 3 && (
                    <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                      +{remoteUsers.length - 3}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  <Users2 className="h-3 w-3 mr-1" />
                  {remoteUsers.length + 1} online
                </Badge>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVersions(!showVersions)}
            >
              <Clock className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto py-8 px-6">
            <RichTextEditor
              content={content}
              onChange={handleContentChange}
              editable={currentUser?.role !== 'Viewer'}
              collaborators={remoteUsers}
              onPresence={(isTyping) => {
                if (isConnected && currentPage) {
                  sendPresence(isTyping);
                }
              }}
              onCursor={(position) => {
                if (isConnected && currentPage) {
                  sendCursor(position);
                }
              }}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Version History Sidebar */}
      {showVersions && (
        <div className="w-80 border-l border-border bg-card">
          <VersionHistory
            pageId={currentPage.id}
            currentContent={content}
            onClose={() => setShowVersions(false)}
          />
        </div>
      )}
    </div>
  );
}

function FileText({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
