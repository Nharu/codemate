'use client';

import { useState } from 'react';
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    FolderOpen,
    MoreVertical,
    Edit3,
    Trash2,
    Eye,
    Code2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './dropdown-menu';
import type { FileNode } from '@/lib/file-tree';

interface FileTreeProps {
    tree: FileNode[];
    onFileClick?: (file: FileNode) => void;
    onFileEdit?: (file: FileNode) => void;
    onFileDelete?: (file: FileNode) => void;
    onFileView?: (file: FileNode) => void;
    onFolderDelete?: (folder: FileNode) => void;
    expandedFolders?: Set<string>;
    onToggleFolder?: (path: string) => void;
    compactMode?: boolean;
}

interface FileTreeNodeProps {
    node: FileNode;
    level: number;
    isExpanded: boolean;
    onToggle: () => void;
    onFileClick?: (file: FileNode) => void;
    onFileEdit?: (file: FileNode) => void;
    onFileDelete?: (file: FileNode) => void;
    onFileView?: (file: FileNode) => void;
    onFolderDelete?: (folder: FileNode) => void;
    expandedFolders?: Set<string>;
    onToggleFolder?: (path: string) => void;
    compactMode?: boolean;
}

function FileTreeNode({
    node,
    level,
    isExpanded,
    onToggle,
    onFileClick,
    onFileEdit,
    onFileDelete,
    onFileView,
    onFolderDelete,
    expandedFolders,
    onToggleFolder,
    compactMode = false,
}: FileTreeNodeProps) {
    const formatFileSize = (bytes: number | undefined) => {
        if (bytes === undefined || bytes === null || isNaN(bytes))
            return '0 Bytes';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleClick = () => {
        if (node.type === 'folder') {
            onToggle();
        } else {
            onFileClick?.(node);
        }
    };

    return (
        <div>
            <div
                className={cn(
                    'flex items-center justify-between group hover:bg-gray-50 rounded-lg px-2 py-1 cursor-pointer',
                    level > 0 && 'ml-4',
                )}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
                <div
                    className="flex items-center space-x-2 flex-1 min-w-0"
                    onClick={handleClick}
                >
                    {node.type === 'folder' ? (
                        <>
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            )}
                            {isExpanded ? (
                                <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            ) : (
                                <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            )}
                        </>
                    ) : (
                        <>
                            <div className="w-4 flex-shrink-0" />{' '}
                            {/* Spacer for alignment */}
                            <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        </>
                    )}
                    <span className="font-medium text-sm truncate">
                        {node.name}
                    </span>
                    {node.type === 'file' && !compactMode && (
                        <div className="flex items-center space-x-2 text-xs text-gray-500 flex-shrink-0">
                            {node.language && (
                                <span className="flex items-center">
                                    <Code2 className="mr-1 h-3 w-3 flex-shrink-0" />
                                    {node.language}
                                </span>
                            )}
                            <span>{formatFileSize(node.size)}</span>
                        </div>
                    )}
                </div>

                {((node.type === 'file' &&
                    (onFileEdit || onFileDelete || onFileView)) ||
                    (node.type === 'folder' && onFolderDelete)) && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="h-3 w-3 flex-shrink-0" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {node.type === 'file' && (
                                <>
                                    {onFileView && (
                                        <DropdownMenuItem
                                            onClick={() => onFileView(node)}
                                        >
                                            <Eye className="mr-2 h-4 w-4 flex-shrink-0" />
                                            보기
                                        </DropdownMenuItem>
                                    )}
                                    {onFileEdit && (
                                        <DropdownMenuItem
                                            onClick={() => onFileEdit(node)}
                                        >
                                            <Edit3 className="mr-2 h-4 w-4 flex-shrink-0" />
                                            편집
                                        </DropdownMenuItem>
                                    )}
                                    {onFileDelete && (
                                        <DropdownMenuItem
                                            onClick={() => onFileDelete(node)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4 flex-shrink-0" />
                                            삭제
                                        </DropdownMenuItem>
                                    )}
                                </>
                            )}
                            {node.type === 'folder' && onFolderDelete && (
                                <DropdownMenuItem
                                    onClick={() => onFolderDelete(node)}
                                    className="text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4 flex-shrink-0" />
                                    폴더 삭제
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {node.type === 'folder' &&
                isExpanded &&
                node.children.length > 0 && (
                    <div className="mt-1">
                        <FileTree
                            tree={node.children}
                            level={level + 1}
                            onFileClick={onFileClick}
                            onFileEdit={onFileEdit}
                            onFileDelete={onFileDelete}
                            onFileView={onFileView}
                            onFolderDelete={onFolderDelete}
                            expandedFolders={expandedFolders}
                            onToggleFolder={onToggleFolder}
                            compactMode={compactMode}
                        />
                    </div>
                )}
        </div>
    );
}

interface FileTreeInternalProps extends FileTreeProps {
    level?: number;
}

function FileTree({
    tree,
    level = 0,
    onFileClick,
    onFileEdit,
    onFileDelete,
    onFileView,
    onFolderDelete,
    expandedFolders,
    onToggleFolder,
    compactMode = false,
}: FileTreeInternalProps) {
    const [internalExpandedFolders, setInternalExpandedFolders] = useState<
        Set<string>
    >(new Set());

    const currentExpandedFolders = expandedFolders || internalExpandedFolders;
    const currentToggleFolder =
        onToggleFolder ||
        ((path: string) => {
            setInternalExpandedFolders((prev) => {
                const next = new Set(prev);
                if (next.has(path)) {
                    next.delete(path);
                } else {
                    next.add(path);
                }
                return next;
            });
        });

    return (
        <div className="space-y-1">
            {tree.map((node) => (
                <FileTreeNode
                    key={node.path}
                    node={node}
                    level={level}
                    isExpanded={currentExpandedFolders.has(node.path)}
                    onToggle={() => currentToggleFolder(node.path)}
                    onFileClick={onFileClick}
                    onFileEdit={onFileEdit}
                    onFileDelete={onFileDelete}
                    onFileView={onFileView}
                    onFolderDelete={onFolderDelete}
                    expandedFolders={currentExpandedFolders}
                    onToggleFolder={currentToggleFolder}
                    compactMode={compactMode}
                />
            ))}
        </div>
    );
}

export default function FileTreeComponent({
    tree,
    onFileClick,
    onFileEdit,
    onFileDelete,
    onFileView,
    onFolderDelete,
    expandedFolders,
    onToggleFolder,
    compactMode = false,
}: FileTreeProps) {
    const [internalExpandedFolders, setInternalExpandedFolders] = useState<
        Set<string>
    >(expandedFolders || new Set());

    const currentExpandedFolders = expandedFolders || internalExpandedFolders;
    const currentToggleFolder =
        onToggleFolder ||
        ((path: string) => {
            setInternalExpandedFolders((prev) => {
                const next = new Set(prev);
                if (next.has(path)) {
                    next.delete(path);
                } else {
                    next.add(path);
                }
                return next;
            });
        });

    const toggleFolder = (path: string) => {
        currentToggleFolder(path);
    };

    return (
        <div className="space-y-1">
            {tree.map((node) => (
                <FileTreeNode
                    key={node.path}
                    node={node}
                    level={0}
                    isExpanded={currentExpandedFolders.has(node.path)}
                    onToggle={() => toggleFolder(node.path)}
                    onFileClick={onFileClick}
                    onFileEdit={onFileEdit}
                    onFileDelete={onFileDelete}
                    onFileView={onFileView}
                    onFolderDelete={onFolderDelete}
                    expandedFolders={currentExpandedFolders}
                    onToggleFolder={currentToggleFolder}
                    compactMode={compactMode}
                />
            ))}
        </div>
    );
}
