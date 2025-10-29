'use client';

import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/lib/context/AppContext';
import Sidebar from '@/components/Sidebar';
import EditorView from '@/components/EditorView';
import KanbanView from '@/components/KanbanView';
import ActivityFeed from '@/components/ActivityFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen, Users } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('editor');
  const { currentProject, currentPage, currentBoard, collaborators } = useApp();

  if (!currentProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
          <p className="text-muted-foreground">Setting up your workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`border-r border-border bg-card transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <PanelLeftOpen className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold">{currentProject.name}</h1>
              <p className="text-sm text-muted-foreground">
                {activeView === 'editor'
                  ? currentPage?.title || 'No page selected'
                  : currentBoard?.name || 'No board selected'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {collaborators.length > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-full">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">{collaborators.length + 1}</span>
              </div>
            )}
          </div>
        </header>

        {/* Main View */}
        <main className="flex-1 overflow-hidden">
          <Tabs value={activeView} onValueChange={setActiveView} className="h-full">
            <div className="border-b border-border bg-card px-6">
              <TabsList>
                <TabsTrigger value="editor">Documentation</TabsTrigger>
                <TabsTrigger value="kanban">Planning</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="editor" className="h-[calc(100%-3rem)] m-0">
              <EditorView />
            </TabsContent>

            <TabsContent value="kanban" className="h-[calc(100%-3rem)] m-0">
              <KanbanView />
            </TabsContent>

            <TabsContent value="activity" className="h-[calc(100%-3rem)] m-0">
              <ActivityFeed />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
