'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Table as TableIcon,
  Highlighter,
} from 'lucide-react';
import './RichTextEditor.css';
import RemoteCursors from '@/lib/extensions/RemoteCursors';

export default function RichTextEditor({
  content,
  onChange,
  editable = true,
  collaborators = [],
  onPresence,
  onCursor,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
        },
      }),
      RemoteCursors,
      Placeholder.configure({
        placeholder: 'Start typing your content here...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: content,
    editable: editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
      // Notify presence (typing)
      onPresence?.(true);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[500px]',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  // Selection/cursor updates
  useEffect(() => {
    if (!editor) return;

    const handleSelection = () => {
      try {
        const { from, to } = editor.state.selection;
        onCursor?.({ from, to });
      } catch {}
    };

    const handleIdle = () => onPresence?.(false);

    editor.on('selectionUpdate', handleSelection);
    editor.on('transaction', handleSelection);

    let idleTimer;
    const handleTyping = () => {
      onPresence?.(true);
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(handleIdle, 900);
    };

    editor.on('update', handleTyping);

    return () => {
      editor.off('selectionUpdate', handleSelection);
      editor.off('transaction', handleSelection);
      editor.off('update', handleTyping);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [editor, onCursor, onPresence]);

  if (!editor) {
    return null;
  }

  // Push remote cursors to extension on change
  useEffect(() => {
    if (!editor) return;
    const cursors = (collaborators || []).map((u) => ({
      from: u.selection?.from ?? u.position?.from ?? u.position?.pos ?? 0,
      to: u.selection?.to ?? u.position?.to ?? u.position?.pos ?? 0,
      color: u.color,
      name: u.name,
      clientId: u.clientId || u.id,
    }));
    editor.commands.updateCursors(cursors);
  }, [editor, collaborators]);

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="border border-border rounded-lg bg-card">
      {/* Toolbar */}
      {editable && (
        <div className="border-b border-border p-2 flex flex-wrap gap-1">
          {/* Text formatting */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-accent' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-accent' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'bg-accent' : ''}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive('code') ? 'bg-accent' : ''}
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={editor.isActive('highlight') ? 'bg-accent' : ''}
          >
            <Highlighter className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-8" />

          {/* Headings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-8" />

          {/* Lists */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-accent' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-accent' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={editor.isActive('taskList') ? 'bg-accent' : ''}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-8" />

          {/* Other */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-accent' : ''}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={addLink}>
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={addTable}>
            <TableIcon className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-8" />

          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor */}
      <div className="p-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
