'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, Calendar, User, Link as LinkIcon, MoreVertical, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function KanbanView() {
  const { currentBoard, updateBoard, currentUser, pages, addActivity, currentProject } = useApp();
  const [activeCard, setActiveCard] = useState(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (!currentBoard) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <FolderKanban className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No board selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a board from the sidebar or create a new one
          </p>
        </div>
      </div>
    );
  }

  const handleDragStart = (event) => {
    const { active } = event;
    const card = findCard(active.id);
    setActiveCard(card);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveCard(null);
      return;
    }

    const activeCard = findCard(active.id);
    const overColumn = findColumnByCardId(over.id) || findColumnById(over.id);

    if (activeCard && overColumn) {
      moveCard(activeCard, overColumn.id);
    }

    setActiveCard(null);
  };

  const findCard = (cardId) => {
    for (const column of currentBoard.columns) {
      const card = column.cards.find(c => c.id === cardId);
      if (card) return card;
    }
    return null;
  };

  const findColumnByCardId = (cardId) => {
    return currentBoard.columns.find(col => col.cards.some(c => c.id === cardId));
  };

  const findColumnById = (columnId) => {
    return currentBoard.columns.find(col => col.id === columnId);
  };

  const moveCard = (card, toColumnId) => {
    const newColumns = currentBoard.columns.map(col => ({
      ...col,
      cards: col.cards.filter(c => c.id !== card.id),
    }));

    const targetColumn = newColumns.find(col => col.id === toColumnId);
    if (targetColumn) {
      targetColumn.cards.push(card);
    }

    updateBoard(currentBoard.id, { columns: newColumns });
    
    addActivity({
      type: 'card_moved',
      projectId: currentProject.id,
      userId: currentUser.id,
      userName: currentUser.name,
      resourceName: card.title,
      details: `Moved "${card.title}" to ${targetColumn.title}`,
    });
  };

  const addColumn = () => {
    if (!newColumnTitle.trim()) return;

    const newColumn = {
      id: uuidv4(),
      title: newColumnTitle,
      cards: [],
    };

    updateBoard(currentBoard.id, {
      columns: [...currentBoard.columns, newColumn],
    });

    setNewColumnTitle('');
    setShowAddColumn(false);
    toast.success('Column added');
  };

  const addCard = (columnId, cardData) => {
    const newCard = {
      id: uuidv4(),
      ...cardData,
      createdAt: Date.now(),
      createdBy: currentUser.id,
    };

    const newColumns = currentBoard.columns.map(col =>
      col.id === columnId
        ? { ...col, cards: [...col.cards, newCard] }
        : col
    );

    updateBoard(currentBoard.id, { columns: newColumns });
    
    addActivity({
      type: 'card_created',
      projectId: currentProject.id,
      userId: currentUser.id,
      userName: currentUser.name,
      resourceName: cardData.title,
      details: `Created card "${cardData.title}"`,
    });
    
    toast.success('Card created');
  };

  const updateCard = (columnId, cardId, updates) => {
    const newColumns = currentBoard.columns.map(col =>
      col.id === columnId
        ? {
            ...col,
            cards: col.cards.map(card =>
              card.id === cardId ? { ...card, ...updates } : card
            ),
          }
        : col
    );

    updateBoard(currentBoard.id, { columns: newColumns });
  };

  const deleteCard = (columnId, cardId) => {
    const card = findCard(cardId);
    const newColumns = currentBoard.columns.map(col =>
      col.id === columnId
        ? { ...col, cards: col.cards.filter(c => c.id !== cardId) }
        : col
    );

    updateBoard(currentBoard.id, { columns: newColumns });
    
    if (card) {
      addActivity({
        type: 'card_deleted',
        projectId: currentProject.id,
        userId: currentUser.id,
        userName: currentUser.name,
        resourceName: card.title,
        details: `Deleted card "${card.title}"`,
      });
    }
    
    toast.success('Card deleted');
  };

  return (
    <div className="h-full bg-background">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="flex gap-4 pb-4">
              {currentBoard.columns.map(column => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  addCard={addCard}
                  updateCard={updateCard}
                  deleteCard={deleteCard}
                  pages={pages}
                  currentUser={currentUser}
                  editingCard={editingCard}
                  setEditingCard={setEditingCard}
                />
              ))}

              {/* Add Column */}
              {showAddColumn ? (
                <div className="w-80 flex-shrink-0">
                  <div className="bg-card border border-border rounded-lg p-3">
                    <Input
                      placeholder="Column title"
                      value={newColumnTitle}
                      onChange={(e) => setNewColumnTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addColumn();
                        if (e.key === 'Escape') setShowAddColumn(false);
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={addColumn}>
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAddColumn(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-80 flex-shrink-0 h-auto py-8"
                  onClick={() => setShowAddColumn(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>

        <DragOverlay>
          {activeCard ? (
            <div className="bg-card border-2 border-primary rounded-lg p-3 shadow-lg rotate-3">
              <h4 className="font-medium mb-1">{activeCard.title}</h4>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumn({
  column,
  addCard,
  updateCard,
  deleteCard,
  pages,
  currentUser,
  editingCard,
  setEditingCard,
}) {
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      addCard(column.id, {
        title: newCardTitle,
        description: '',
        labels: [],
        assignee: null,
        dueDate: null,
        linkedPageId: null,
      });
      setNewCardTitle('');
      setShowAddCard(false);
    }
  };

  return (
    <div className="w-80 flex-shrink-0">
      <div className="bg-card border border-border rounded-lg">
        {/* Column Header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              {column.title}
              <Badge variant="secondary" className="text-xs">
                {column.cards.length}
              </Badge>
            </h3>
          </div>
        </div>

        {/* Cards */}
        <ScrollArea className="max-h-[calc(100vh-16rem)]">
          <SortableContext
            items={column.cards.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="p-2 space-y-2 min-h-[100px]">
              {column.cards.map(card => (
                <KanbanCard
                  key={card.id}
                  card={card}
                  columnId={column.id}
                  updateCard={updateCard}
                  deleteCard={deleteCard}
                  pages={pages}
                  currentUser={currentUser}
                  editingCard={editingCard}
                  setEditingCard={setEditingCard}
                />
              ))}
            </div>
          </SortableContext>
        </ScrollArea>

        {/* Add Card */}
        <div className="p-2 border-t border-border">
          {showAddCard ? (
            <div className="space-y-2">
              <Input
                placeholder="Card title"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCard();
                  if (e.key === 'Escape') setShowAddCard(false);
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddCard}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddCard(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowAddCard(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanCard({
  card,
  columnId,
  updateCard,
  deleteCard,
  pages,
  currentUser,
  editingCard,
  setEditingCard,
}) {
  const isEditing = editingCard === card.id;
  const [localCard, setLocalCard] = useState(card);

  const handleSave = () => {
    updateCard(columnId, card.id, localCard);
    setEditingCard(null);
  };

  if (isEditing) {
    return (
      <div className="bg-card border border-primary rounded-lg p-3 space-y-3">
        <Input
          placeholder="Title"
          value={localCard.title}
          onChange={(e) => setLocalCard({ ...localCard, title: e.target.value })}
        />
        <Textarea
          placeholder="Description"
          value={localCard.description}
          onChange={(e) => setLocalCard({ ...localCard, description: e.target.value })}
          rows={3}
        />
        <div className="space-y-2">
          <Select
            value={localCard.linkedPageId || ''}
            onValueChange={(value) => setLocalCard({ ...localCard, linkedPageId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Link to page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No page linked</SelectItem>
              {pages.map(page => (
                <SelectItem key={page.id} value={page.id}>
                  {page.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setLocalCard(card);
              setEditingCard(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-background border border-border rounded-lg p-3 cursor-pointer hover:border-primary transition-colors group"
      onClick={() => setEditingCard(card.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm flex-1">{card.title}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                deleteCard(columnId, card.id);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {card.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {card.description}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {card.linkedPageId && (
          <Badge variant="outline" className="text-xs">
            <LinkIcon className="h-3 w-3 mr-1" />
            Linked
          </Badge>
        )}
        {card.dueDate && (
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(card.dueDate).toLocaleDateString()}
          </Badge>
        )}
      </div>
    </div>
  );
}

function FolderKanban({ className }) {
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
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <path d="M8 10v4" />
      <path d="M12 10v2" />
      <path d="M16 10v6" />
    </svg>
  );
}
