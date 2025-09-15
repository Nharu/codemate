'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { File, X, Save, Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { File as ProjectFile } from '@/types/project';
import FileTreeComponent from '@/components/ui/file-tree';
import { buildFileTree, type FileNode } from '@/lib/file-tree';
import { cn } from '@/lib/utils';
import { NewFileModal } from '@/components/ui/new-file-modal';
import { useIdeSessionSocket } from '@/hooks/useIdeSessionSocket';
import type { editor } from 'monaco-editor';

interface OpenTab {
    id: string;
    name: string;
    path: string;
    content: string;
    language?: string;
    isDirty: boolean;
    isNew?: boolean;
}

interface WebIDEProps {
    projectId: string;
    files: ProjectFile[];
    onFileCreate?: (
        path: string,
        content: string,
        language?: string,
    ) => Promise<ProjectFile | void>;
    onFileUpdate?: (fileId: string, content: string) => Promise<void>;
    onFileDelete?: (fileId: string) => Promise<void>;
    onFolderDelete?: (folderPath: string) => Promise<void>;
}

export default function WebIDE({
    projectId,
    files,
    onFileCreate,
    onFileUpdate,
    onFileDelete,
    onFolderDelete,
}: WebIDEProps) {
    const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
    const [isSessionLoaded, setIsSessionLoaded] = useState(false);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    // IDE Session socket
    const {
        sessionData,
        isLoading: isSessionLoading,
        updateSession,
        extendSession,
    } = useIdeSessionSocket(projectId);

    const activeTab = openTabs.find((tab) => tab.id === activeTabId);

    const getLanguageFromPath = useCallback((path: string): string => {
        const ext = path.split('.').pop()?.toLowerCase();
        const languageMap: Record<string, string> = {
            js: 'javascript',
            jsx: 'javascript',
            ts: 'typescript',
            tsx: 'typescript',
            py: 'python',
            java: 'java',
            cpp: 'cpp',
            c: 'c',
            h: 'c',
            go: 'go',
            rs: 'rust',
            php: 'php',
            rb: 'ruby',
            swift: 'swift',
            kt: 'kotlin',
            html: 'html',
            css: 'css',
            scss: 'scss',
            json: 'json',
            yaml: 'yaml',
            yml: 'yaml',
            md: 'markdown',
            txt: 'plaintext',
            xml: 'xml',
            sh: 'bash',
        };
        return languageMap[ext || ''] || 'plaintext';
    }, []);

    const openFile = (file: FileNode) => {
        const existingTab = openTabs.find((tab) => tab.id === file.id);
        if (existingTab) {
            setActiveTabId(file.id);
            return;
        }

        const projectFile = files.find((f) => f.id === file.id);
        if (!projectFile) return;

        const newTab: OpenTab = {
            id: file.id,
            name: file.name,
            path: file.path,
            content: projectFile.content || '',
            language: projectFile.language || getLanguageFromPath(file.path),
            isDirty: false,
        };

        setOpenTabs((prev) => [...prev, newTab]);
        setActiveTabId(file.id);
    };

    const closeTab = (tabId: string) => {
        const tab = openTabs.find((t) => t.id === tabId);
        if (tab?.isDirty) {
            const confirmed = window.confirm(
                '저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?',
            );
            if (!confirmed) return;
        }

        setOpenTabs((prev) => prev.filter((tab) => tab.id !== tabId));

        if (activeTabId === tabId) {
            const remainingTabs = openTabs.filter((tab) => tab.id !== tabId);
            setActiveTabId(
                remainingTabs.length > 0
                    ? remainingTabs[remainingTabs.length - 1].id
                    : null,
            );
        }
    };

    const saveTab = useCallback(
        async (tabId: string) => {
            const tab = openTabs.find((t) => t.id === tabId);
            if (!tab) return;

            try {
                if (tab.isNew && onFileCreate) {
                    const createdFile = await onFileCreate(
                        tab.path,
                        tab.content,
                        tab.language,
                    );
                    if (createdFile) {
                        // Update tab with real file ID and mark as saved
                        setOpenTabs((prev) =>
                            prev.map((t) =>
                                t.id === tabId
                                    ? {
                                          ...t,
                                          id: createdFile.id,
                                          isDirty: false,
                                          isNew: false,
                                      }
                                    : t,
                            ),
                        );
                        // Update active tab ID if this was the active tab
                        if (activeTabId === tabId) {
                            setActiveTabId(createdFile.id);
                        }
                    } else {
                        // Fallback if no file returned
                        setOpenTabs((prev) =>
                            prev.map((t) =>
                                t.id === tabId
                                    ? { ...t, isDirty: false, isNew: false }
                                    : t,
                            ),
                        );
                    }
                } else if (onFileUpdate) {
                    await onFileUpdate(tab.id, tab.content);
                    setOpenTabs((prev) =>
                        prev.map((t) =>
                            t.id === tabId ? { ...t, isDirty: false } : t,
                        ),
                    );
                }
            } catch (error) {
                console.error('파일 저장 실패:', error);
                throw error;
            }
        },
        [openTabs, activeTabId, onFileCreate, onFileUpdate],
    );

    const handleEditorChange = useCallback(
        (value: string | undefined) => {
            if (!activeTabId || value === undefined) return;

            setOpenTabs((prev) =>
                prev.map((tab) =>
                    tab.id === activeTabId
                        ? { ...tab, content: value, isDirty: true }
                        : tab,
                ),
            );
        },
        [activeTabId],
    );

    const createNewFile = () => {
        setIsNewFileModalOpen(true);
    };

    const handleCreateNewFile = (fileName: string, language?: string) => {
        const newTab: OpenTab = {
            id: `new-${Date.now()}`,
            name: fileName,
            path: fileName,
            content: '',
            language: language || getLanguageFromPath(fileName),
            isDirty: true,
            isNew: true,
        };

        setOpenTabs((prev) => [...prev, newTab]);
        setActiveTabId(newTab.id);
    };

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                if (activeTabId) {
                    saveTab(activeTabId);
                }
            }
        },
        [activeTabId, saveTab],
    );

    const startResizing = (e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
    };

    const stopResizing = () => {
        setIsResizing(false);
    };

    const resize = useCallback(
        (e: MouseEvent) => {
            if (isResizing) {
                const newWidth = e.clientX;
                if (newWidth >= 200 && newWidth <= 600) {
                    setSidebarWidth(newWidth);
                }
            }
        },
        [isResizing],
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, resize]);

    // Session restoration effect
    useEffect(() => {
        if (!isSessionLoading && !isSessionLoaded) {
            if (sessionData) {
                // Restore session state
                setSidebarCollapsed(sessionData.sidebarCollapsed);
                setSidebarWidth(sessionData.sidebarWidth);

                // Restore tabs that still exist in current files
                const validTabs: OpenTab[] = [];

                for (const sessionTab of sessionData.openTabs) {
                    if (sessionTab.isNew) {
                        // Skip new/unsaved tabs as they won't exist after refresh
                        continue;
                    }

                    const projectFile = files.find(
                        (f) => f.id === sessionTab.id,
                    );
                    if (projectFile) {
                        validTabs.push({
                            id: sessionTab.id,
                            name: sessionTab.name,
                            path: sessionTab.path,
                            content: projectFile.content || '',
                            language:
                                projectFile.language ||
                                getLanguageFromPath(sessionTab.path),
                            isDirty: false,
                            isNew: false,
                        });
                    }
                }

                setOpenTabs(validTabs);

                // Restore active tab if it exists in valid tabs
                const activeTab = validTabs.find(
                    (tab) => tab.id === sessionData.activeTabId,
                );
                setActiveTabId(activeTab ? sessionData.activeTabId : null);
            }
            // Mark session as loaded regardless of whether data exists or not
            setIsSessionLoaded(true);
        }
    }, [
        sessionData,
        isSessionLoaded,
        isSessionLoading,
        files,
        getLanguageFromPath,
    ]);

    // Auto-save session state via WebSocket
    useEffect(() => {
        if (!isSessionLoaded) return; // Don't save until initial session is loaded

        const sessionState = {
            openTabs: openTabs
                .filter((tab) => !tab.isNew)
                .map((tab) => ({
                    id: tab.id,
                    name: tab.name,
                    path: tab.path,
                    language: tab.language,
                    isNew: tab.isNew,
                })),
            activeTabId,
            sidebarCollapsed,
            sidebarWidth,
        };

        updateSession(sessionState);
    }, [
        openTabs,
        activeTabId,
        sidebarCollapsed,
        sidebarWidth,
        isSessionLoaded,
        updateSession,
    ]);

    // Extend session TTL every 5 minutes
    useEffect(() => {
        const interval = setInterval(
            () => {
                extendSession();
            },
            5 * 60 * 1000,
        ); // 5 minutes

        return () => clearInterval(interval);
    }, [extendSession]);

    return (
        <div className="flex h-full bg-gray-50">
            {/* Sidebar */}
            <div
                className={cn(
                    'border-r bg-white flex-shrink-0 relative',
                    sidebarCollapsed ? 'w-0' : '',
                )}
                style={{
                    width: sidebarCollapsed ? 0 : sidebarWidth,
                    transition: sidebarCollapsed ? 'width 0.2s ease' : 'none',
                }}
            >
                {!sidebarCollapsed && (
                    <>
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium truncate">
                                        파일 탐색기
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={createNewFile}
                                        className="flex-shrink-0"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <ScrollArea className="flex-1 overflow-y-auto">
                                <div className="p-2">
                                    <FileTreeComponent
                                        tree={buildFileTree(
                                            files.map((file) => ({
                                                id: file.id,
                                                path: file.path,
                                                size:
                                                    typeof file.size ===
                                                    'string'
                                                        ? parseInt(
                                                              file.size,
                                                              10,
                                                          )
                                                        : file.size,
                                                language: file.language,
                                                updated_at: file.updated_at,
                                            })),
                                        )}
                                        onFileClick={openFile}
                                        onFileDelete={async (file) => {
                                            if (onFileDelete) {
                                                await onFileDelete(file.id);
                                                closeTab(file.id);
                                            }
                                        }}
                                        onFolderDelete={async (folder) => {
                                            if (onFolderDelete) {
                                                await onFolderDelete(
                                                    folder.path,
                                                );
                                                // Close all tabs in the folder
                                                const folderTabs =
                                                    openTabs.filter((tab) =>
                                                        tab.path.startsWith(
                                                            folder.path + '/',
                                                        ),
                                                    );
                                                folderTabs.forEach((tab) =>
                                                    closeTab(tab.id),
                                                );
                                            }
                                        }}
                                        compactMode={sidebarWidth < 280}
                                    />
                                </div>
                            </ScrollArea>
                        </div>
                        {/* Resize Handle */}
                        <div
                            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors group"
                            onMouseDown={startResizing}
                        >
                            <div className="w-full h-full group-hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </>
                )}
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <div className="h-12 bg-white border-b flex items-center px-4 flex-shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    >
                        <FolderOpen className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="mx-2 h-6" />
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">웹 IDE</span>
                        {activeTab && (
                            <>
                                <Separator
                                    orientation="vertical"
                                    className="h-4"
                                />
                                <Badge variant="outline">
                                    {activeTab.language}
                                </Badge>
                            </>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                {openTabs.length > 0 && (
                    <div className="bg-gray-100 border-b flex overflow-x-auto flex-shrink-0">
                        {openTabs.map((tab) => (
                            <div
                                key={tab.id}
                                className={cn(
                                    'flex items-center px-3 py-2 border-r cursor-pointer min-w-0',
                                    activeTabId === tab.id
                                        ? 'bg-white border-b-2 border-blue-500'
                                        : 'hover:bg-gray-50',
                                )}
                                onClick={() => setActiveTabId(tab.id)}
                            >
                                <File className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="text-sm truncate">
                                    {tab.name}
                                    {tab.isDirty && '*'}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2 h-4 w-4 p-0 hover:bg-gray-200"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeTab(tab.id);
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Editor */}
                <div className="flex-1 min-h-0">
                    {activeTab ? (
                        <div className="h-full flex flex-col">
                            <div className="flex-1 min-h-0">
                                <Editor
                                    height="100%"
                                    language={activeTab.language}
                                    value={activeTab.content}
                                    onChange={handleEditorChange}
                                    onMount={(editor) => {
                                        editorRef.current = editor;
                                    }}
                                    options={{
                                        minimap: { enabled: true },
                                        fontSize: 14,
                                        lineNumbers: 'on',
                                        roundedSelection: false,
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        wordWrap: 'on',
                                        tabSize: 2,
                                        insertSpaces: true,
                                    }}
                                    theme="vs-dark"
                                />
                            </div>
                            {/* Status Bar */}
                            <div className="h-6 bg-blue-600 text-white px-4 flex items-center justify-between text-xs flex-shrink-0">
                                <div className="flex items-center space-x-4">
                                    <span>{activeTab.path}</span>
                                    <span>{activeTab.language}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {activeTab.isDirty && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 px-2 text-white hover:bg-blue-700"
                                            onClick={() =>
                                                saveTab(activeTab.id)
                                            }
                                        >
                                            <Save className="h-3 w-3 mr-1" />
                                            저장 (Ctrl+S)
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <File className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">
                                    편집할 파일을 선택하세요
                                </p>
                                <p className="text-sm">
                                    좌측 파일 탐색기에서 파일을 클릭하거나 새
                                    파일을 만들어보세요
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* New File Modal */}
            <NewFileModal
                open={isNewFileModalOpen}
                onOpenChange={setIsNewFileModalOpen}
                onConfirm={handleCreateNewFile}
            />
        </div>
    );
}
