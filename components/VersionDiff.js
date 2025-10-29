'use client';

import { useEffect, useState } from 'react';
import { DiffMatchPatch } from 'diff-match-patch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function VersionDiff({ oldContent, newContent, oldVersion, newVersion }) {
  const [diffHtml, setDiffHtml] = useState('');

  useEffect(() => {
    if (!oldContent || !newContent) return;

    // Strip HTML tags for comparison
    const stripHtml = (html) => {
      const tmp = document.createElement('DIV');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    const oldText = stripHtml(oldContent);
    const newText = stripHtml(newContent);

    const dmp = new DiffMatchPatch();
    const diffs = dmp.diff_main(oldText, newText);
    dmp.diff_cleanupSemantic(diffs);

    let html = '';
    diffs.forEach(([operation, text]) => {
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');

      if (operation === 1) {
        // Insertion - green
        html += `<span class="bg-green-500/20 text-green-700 dark:text-green-300 px-1 rounded">${escaped}</span>`;
      } else if (operation === -1) {
        // Deletion - red with strikethrough
        html += `<span class="bg-red-500/20 text-red-700 dark:text-red-300 line-through px-1 rounded">${escaped}</span>`;
      } else {
        // Unchanged
        html += escaped;
      }
    });

    setDiffHtml(html);
  }, [oldContent, newContent]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Version Comparison</h3>
          <div className="flex items-center gap-2 mt-1">
            {oldVersion && (
              <Badge variant="outline">
                {oldVersion.authorName} - {new Date(oldVersion.timestamp).toLocaleDateString()}
              </Badge>
            )}
            <span className="text-muted-foreground">→</span>
            {newVersion && (
              <Badge variant="outline">
                {newVersion.authorName} - {new Date(newVersion.timestamp).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded">Added</span>
          <span className="bg-red-500/20 text-red-700 dark:text-red-300 px-2 py-1 rounded line-through">Removed</span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div
          className="prose prose-sm max-w-none whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: diffHtml }}
        />
      </ScrollArea>
    </div>
  );
}

