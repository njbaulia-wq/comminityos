'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export interface ActionQueueItem {
  id: string;
  title: string;
  description?: string;
  type: 'expense_approval' | 'dues_verification' | 'member_approval';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

export interface ActionQueueProps {
  items: ActionQueueItem[];
  onActionClick?: (item: ActionQueueItem) => void;
  isLoading?: boolean;
}

export const ActionQueue: React.FC<ActionQueueProps> = ({
  items,
  onActionClick,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-1/3 bg-neutral-200 rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-12 bg-neutral-100 rounded" />
          <div className="h-12 bg-neutral-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">
          Antrean Tindakan & Persetujuan
        </CardTitle>
        <Badge variant={items.length > 0 ? 'warning' : 'secondary'}>
          {items.length} Pending
        </Badge>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 border border-dashed border-neutral-200 rounded-lg text-center text-sm text-neutral-500 dark:border-neutral-800">
            Tidak ada tugas persetujuan tertunda
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:bg-neutral-900/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {item.title}
                    </span>
                    <Badge
                      variant={
                        item.priority === 'urgent' || item.priority === 'high'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {item.priority}
                    </Badge>
                  </div>
                  {item.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {item.description}
                    </p>
                  )}
                </div>
                {onActionClick && (
                  <Button
                    size="sm"
                    className="h-8 text-xs shrink-0"
                    onClick={() => onActionClick(item)}
                  >
                    Proses
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
