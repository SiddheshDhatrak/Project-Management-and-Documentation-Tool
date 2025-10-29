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
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
// import * as Y from 'yjs'; // Will be enabled when Y.js provider is ready
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
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
  Image as ImageIcon,
  AtSign,
  Slash,
} from 'lucide-react';
import ImageExtension from '@/lib/extensions/Image';
import MentionExtension from '@/lib/extensions/Mention';
import { toast } from 'sonner';
import './RichTextEditor.css';

// Slash command handler - we'll handle this via keydown instead

export default function RichTextEditorEnhanced({
  pageId,
  content,
  onChange,
  editable = true,
  collaborators = [],
  currentUser,
  onMention,
}) {
  // Y.js setup - will be enabled when provider is ready
  // const [ydoc] = useState(() => new Y.Doc());
  // const [yXmlFragment, setYXmlFragment] = useState(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashPosition, setSlashPosition] = useState(null);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  
  // WebSocket connection for real-time updates
  const { isConnected, sendUpdate } = useWebSocket(
    pageId ? `page-${pageId}` : null,
    currentUser,
    (message) => {
      // Handle WebSocket messages
      // Y.js integration will be added later when provider is ready
    }
  );

  // Y.js initialization - commented until provider is ready
  // useEffect(() => {
  //   if (pageId) {
  //     const fragment = ydoc.getXmlFragment(`page-${pageId}`);
  //     setYXmlFragment(fragment);
  //     ydoc.on('update', (update) => {
  //       if (isConnected) {
  //         sendUpdate({
  //           type: 'yjs-update',
  //           data: Buffer.from(update).toString('base64'),
  //         });
  //       }
  //     });
  //   }
  // }, [pageId, ydoc, isConnected, sendUpdate]);

  // Collaborator data for cursor extension (when Y.js is enabled)
  // const collaboratorData = collaborators.map((collab) => ({
  //   ...collab,
  //   clientId: collab.clientId || collab.id,
  // }));

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
        },
        // Disable history when Y.js is ready
        // history: !yXmlFragment,
      }),
      // Collaboration extensions - commented until Y.js provider is ready
      // Collaboration.configure({
      //   fragment: yXmlFragment,
      // }),
      // CollaborationCursor.configure({
      //   provider: null, // We'll handle sync via WebSocket
      //   user: currentUser ? {
      //     name: currentUser.name,
      //     color: currentUser.color || '#3b82f6',
      //   } : null,
      // }),
      Placeholder.configure({
        placeholder: 'Type "/" for commands, "@" for mentions...',
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
      ImageExtension.configure({
        allowBase64: true,
      }),
      MentionExtension.configure({
        HTMLAttributes: {
          class: 'mention bg-primary/10 text-primary px-1 rounded',
        },
        renderLabel({ node }) {
          return `@${node.attrs.label || node.attrs.id}`;
        },
      }),
    ],
    content: content || '',
    editable: editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[500px]',
      },
      handleKeyDown: (view, event) => {
        // Handle slash command
        if (event.key === '/') {
          const { state } = view;
          const { $from } = state.selection;
          const lineStart = $from.start();
          
          // Check if we're at start of line or after whitespace
          if ($from.pos === lineStart || state.doc.textBetween(lineStart, $from.pos).trim().length === 0) {
            setSlashPosition($from.pos);
            setShowSlashMenu(true);
            event.preventDefault();
            return true;
          }
        }
        if (event.key === 'Escape') {
          setShowSlashMenu(false);
          setShowMentionMenu(false);
        }
        if (showSlashMenu && event.key !== 'ArrowUp' && event.key !== 'ArrowDown' && event.key !== 'Enter') {
          setShowSlashMenu(false);
        }
      },
    },
  }, [currentUser]); // Temporarily remove yXmlFragment dependency

  useEffect(() => {
    if (editor && content !== undefined && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  const handleSlashCommand = (command) => {
    setShowSlashMenu(false);
    
    switch (command) {
      case 'heading1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'heading2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'heading3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'bullet-list':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'ordered-list':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'task-list':
        editor.chain().focus().toggleTaskList().run();
        break;
      case 'table':
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case 'quote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'code':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'divider':
        editor.chain().focus().setHorizontalRule().run();
        break;
      default:
        break;
    }
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target.result;
          editor.chain().focus().setImage({ src }).run();
          toast.success('Image added');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleMention = (user) => {
    editor.chain().focus().insertMention({
      id: user.id,
      label: user.name,
    }).run();
    setShowMentionMenu(false);
    
    if (onMention) {
      onMention(user);
    }
    
    toast.success(`Mentioned @${user.name}`);
  };

  if (!editor) {
    return null;
  }

  const slashCommands = [
    { id: 'heading1', label: 'Heading 1', icon: Heading1 },
    { id: 'heading2', label: 'Heading 2', icon: Heading2 },
    { id: 'heading3', label: 'Heading 3', icon: Heading3 },
    { id: 'bullet-list', label: 'Bullet List', icon: List },
    { id: 'ordered-list', label: 'Numbered List', icon: ListOrdered },
    { id: 'task-list', label: 'Task List', icon: CheckSquare },
    { id: 'table', label: 'Table', icon: TableIcon },
    { id: 'quote', label: 'Quote', icon: Quote },
    { id: 'code', label: 'Code Block', icon: Code },
    { id: 'divider', label: 'Divider', icon: Separator },
  ];

  return (
    <div className="border border-border rounded-lg bg-card relative">
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
          <Button variant="ghost" size="icon" onClick={handleImageUpload}>
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const url = window.prompt('Enter URL:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <TableIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor */}
      <div className="p-6 relative">
        <EditorContent editor={editor} />
        
        {/* Slash Command Menu */}
        {showSlashMenu && (
          <Popover open={showSlashMenu} onOpenChange={setShowSlashMenu}>
            <PopoverContent className="w-64 p-0">
              <Command>
                <CommandInput placeholder="Search commands..." />
                <CommandList>
                  <CommandEmpty>No command found.</CommandEmpty>
                  {slashCommands.map((cmd) => (
                    <CommandItem
                      key={cmd.id}
                      onSelect={() => handleSlashCommand(cmd.id)}
                    >
                      <cmd.icon className="h-4 w-4 mr-2" />
                      {cmd.label}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}

