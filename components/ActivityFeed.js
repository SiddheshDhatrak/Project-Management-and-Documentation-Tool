'use client';

import { useApp } from '@/lib/context/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, FolderKanban, RotateCcw, Trash2, Edit, Users, Briefcase, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

export default function ActivityFeed() {
  const { activities, currentProject } = useApp();
  const [filter, setFilter] = useState('all');

  const getActivityIcon = (type) => {
    switch (type) {
      case 'page_created':
      case 'page_updated':
      case 'page_deleted':
        return <FileText className="h-4 w-4" />;
      case 'board_created':
      case 'card_created':
      case 'card_moved':
      case 'card_deleted':
        return <FolderKanban className="h-4 w-4" />;
      case 'version_restored':
        return <RotateCcw className="h-4 w-4" />;
      case 'project_created':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Edit className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type) => {
    if (type.includes('created')) return 'text-green-500';
    if (type.includes('deleted')) return 'text-red-500';
    if (type.includes('updated') || type.includes('moved')) return 'text-blue-500';
    if (type.includes('restored')) return 'text-purple-500';
    return 'text-muted-foreground';
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'pages') return activity.type.includes('page');
    if (filter === 'boards') return activity.type.includes('card') || activity.type.includes('board');
    return true;
  });

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No project selected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Activity Feed</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time updates from your team
            </p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter activities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="pages">Pages Only</SelectItem>
              <SelectItem value="boards">Boards Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Activities */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No activities yet</h3>
              <p className="text-sm text-muted-foreground">
                Start creating pages or cards to see activities here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors"
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center ${
                      getActivityColor(activity.type)
                    }`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.userName}</span>{' '}
                          <span className="text-muted-foreground">{activity.details}</span>
                        </p>
                        {activity.resourceName && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {activity.resourceName}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
