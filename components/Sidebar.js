'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import {
  PanelLeftClose,
  Plus,
  FileText,
  MoreVertical,
  Trash2,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  Briefcase,
} from 'lucide-react';

export default function Sidebar({ onClose }) {
  const {
    currentUser,
    currentProject,
    projects,
    pages,
    boards,
    currentPage,
    currentBoard,
    setCurrentPage,
    setCurrentBoard,
    createProject,
    switchProject,
    createPage,
    createBoard,
    deletePage,
  } = useApp();

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    pages: true,
    boards: true,
  });

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName, newProjectDesc);
      setNewProjectName('');
      setNewProjectDesc('');
      setProjectDialogOpen(false);
    }
  };

  const handleCreatePage = () => {
    if (newPageTitle.trim()) {
      createPage(newPageTitle);
      setNewPageTitle('');
      setPageDialogOpen(false);
    }
  };

  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      createBoard(newBoardName);
      setNewBoardName('');
      setBoardDialogOpen(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Workspace</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {/* Project Switcher */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="truncate">{currentProject?.name}</span>
                <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {projects.map(project => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => switchProject(project.id)}
                  className={currentProject?.id === project.id ? 'bg-accent' : ''}
                >
                  {project.name}
                </DropdownMenuItem>
              ))}
              <Separator className="my-1" />
              <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </DropdownMenuItem>
                </DialogTrigger>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator />

        {/* Pages Section */}
        <div className="p-3">
          <div
            className="flex items-center justify-between mb-2 cursor-pointer"
            onClick={() => toggleSection('pages')}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {expandedSections.pages ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <FileText className="h-4 w-4" />
              <span>Pages</span>
            </div>
            <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {expandedSections.pages && (
            <div className="space-y-1 ml-2">
              {pages.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No pages yet</p>
              ) : (
                pages.map(page => (
                  <div
                    key={page.id}
                    className={`flex items-center justify-between group rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent ${
                      currentPage?.id === page.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    <span className="truncate">{page.title}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deletePage(page.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Boards Section */}
        <div className="p-3">
          <div
            className="flex items-center justify-between mb-2 cursor-pointer"
            onClick={() => toggleSection('boards')}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {expandedSections.boards ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <FolderKanban className="h-4 w-4" />
              <span>Boards</span>
            </div>
            <Dialog open={boardDialogOpen} onOpenChange={setBoardDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {expandedSections.boards && (
            <div className="space-y-1 ml-2">
              {boards.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No boards yet</p>
              ) : (
                boards.map(board => (
                  <div
                    key={board.id}
                    className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent ${
                      currentBoard?.id === board.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setCurrentBoard(board)}
                  >
                    <span className="truncate">{board.name}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* User Info */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
            style={{ backgroundColor: currentUser?.color || '#3b82f6' }}
          >
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser?.name}</p>
            <p className="text-xs text-muted-foreground">{currentUser?.role}</p>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project workspace for your team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Project Name</label>
              <Input
                placeholder="Enter project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Input
                placeholder="Enter description (optional)"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Add a new documentation page to your project.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Page title"
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePage}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={boardDialogOpen} onOpenChange={setBoardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>
              Create a new Kanban board for planning.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Board name"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBoardDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBoard}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
