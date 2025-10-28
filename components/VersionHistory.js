'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, RotateCcw, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function VersionHistory({ pageId, currentContent, onClose }) {
  const { getVersions, restoreVersion } = useApp();
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    const pageVersions = getVersions(pageId);
    setVersions(pageVersions);
  }, [pageId, getVersions]);

  const handleRestore = (versionId) => {
    if (window.confirm('Are you sure you want to restore this version? Current changes will be saved as a new version.')) {
      restoreVersion(pageId, versionId);
      const updatedVersions = getVersions(pageId);
      setVersions(updatedVersions);
      setSelectedVersion(null);
    }
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Version History
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Versions List */}
      <ScrollArea className="flex-1 p-4">
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No version history yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Versions are created automatically as you edit
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className={`border border-border rounded-lg p-3 cursor-pointer hover:border-primary transition-colors ${
                  selectedVersion?.id === version.id ? 'border-primary bg-accent' : ''
                }`}
                onClick={() => setSelectedVersion(version)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">
                      {index === 0 ? 'Latest Version' : `Version ${versions.length - index}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(version.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  {index !== 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(version.id);
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  By {version.authorName}
                </p>
                <div className="mt-2 text-xs text-muted-foreground line-clamp-3">
                  {stripHtml(version.content).substring(0, 150)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Preview */}
      {selectedVersion && (
        <div className="border-t border-border p-4 bg-muted">
          <h4 className="text-sm font-medium mb-2">Preview</h4>
          <ScrollArea className="h-32">
            <div
              className="text-xs prose prose-sm"
              dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
            />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
