'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

export interface FolderItem {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface FolderTreeProps {
  folders: FolderItem[];
  selectedFolderId?: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolderClick?: () => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolderClick,
}) => {
  return (
    <div className="w-full space-y-2 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
        <span className="text-xs font-semibold uppercase text-neutral-500">Folder</span>
        {onCreateFolderClick && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={onCreateFolderClick}
          >
            + Folder
          </Button>
        )}
      </div>

      <button
        onClick={() => onSelectFolder(null)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors ${
          selectedFolderId === null || selectedFolderId === undefined
            ? 'bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
            : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
        }`}
      >
        <span>📁</span>
        <span>Semua Dokumen</span>
      </button>

      <div className="space-y-1">
        {folders.map((folder) => {
          const isSelected = selectedFolderId === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors ${
                isSelected
                  ? 'bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                  : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
              }`}
            >
              <span>📂</span>
              <span className="truncate">{folder.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
