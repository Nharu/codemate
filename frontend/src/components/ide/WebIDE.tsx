'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const Editor = dynamic(
    () =>
        import('@monaco-editor/react').then((mod) => ({ default: mod.Editor })),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">에디터 로딩 중...</div>
            </div>
        ),
    },
);
import { File, X, Save, Plus, FolderOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { File as ProjectFile } from '@/types/project';
import FileTreeComponent from '@/components/ui/file-tree';
import { buildFileTree, type FileNode } from '@/lib/file-tree';
import { cn } from '@/lib/utils';
import { NewFileModal } from '@/components/ui/new-file-modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { AlertModal } from '@/components/ui/alert-modal';
import { useIdeSessionSocket } from '@/hooks/useIdeSessionSocket';
import { useAiReviewSocket } from '@/hooks/useAiReviewSocket';
import CodeReviewPanel, {
    type CodeReviewResult,
} from '@/components/ai/CodeReviewPanel';
import apiClient from '@/lib/api-client';
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
    onFileRename?: (fileId: string, newPath: string) => Promise<void>;
    onFileDelete?: (fileId: string) => Promise<void>;
    onFolderDelete?: (folderPath: string) => Promise<void>;
    onFolderRename?: (
        oldFolderPath: string,
        newFolderPath: string,
    ) => Promise<void>;
}

export default function WebIDE({
    projectId,
    files,
    onFileCreate,
    onFileUpdate,
    onFileRename,
    onFileDelete,
    onFolderDelete,
    onFolderRename,
}: WebIDEProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
    const [newFileInitialPath, setNewFileInitialPath] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(
        null,
    );
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isSessionLoaded, setIsSessionLoaded] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set(),
    );
    const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(false);
    const [currentFileReview, setCurrentFileReview] =
        useState<CodeReviewResult | null>(null);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    // AI Code Review Socket
    const {
        isConnected: isReviewSocketConnected,
        startReview,
        cancelReview,
        currentProgress,
        lastResult: reviewResult,
        lastError: reviewError,
        clearState: clearReviewState,
    } = useAiReviewSocket();

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

    // Function to get display name for tabs (handles duplicate file names)
    // Function to expand folders for a given file path
    const expandFoldersForPath = useCallback((filePath: string) => {
        const pathParts = filePath.split('/').filter((part) => part !== '');
        const foldersToExpand = new Set<string>();

        // Build all parent folder paths
        for (let i = 0; i < pathParts.length - 1; i++) {
            const folderPath = pathParts.slice(0, i + 1).join('/');
            foldersToExpand.add(folderPath);
        }

        setExpandedFolders((prev) => new Set([...prev, ...foldersToExpand]));
    }, []);

    const getTabDisplayName = useCallback(
        (currentTab: OpenTab): string => {
            const tabsWithSameName = openTabs.filter(
                (tab) => tab.name === currentTab.name,
            );

            if (tabsWithSameName.length <= 1) {
                return currentTab.name;
            }

            // Find the minimum unique path suffix needed to distinguish files
            const currentPathParts = currentTab.path
                .split('/')
                .filter((part) => part !== '');
            const fileName = currentPathParts[currentPathParts.length - 1];

            // Check each level of parent directories until we find a unique combination
            for (let depth = 1; depth < currentPathParts.length; depth++) {
                const suffixParts = currentPathParts.slice(-depth - 1, -1);
                const candidateDisplay = `${fileName} (${suffixParts.join('/')})`;

                // Check if this display name would be unique
                const conflictingTabs = tabsWithSameName.filter((tab) => {
                    if (tab.id === currentTab.id) return false;

                    const otherPathParts = tab.path
                        .split('/')
                        .filter((part) => part !== '');
                    const otherSuffixParts = otherPathParts.slice(
                        -depth - 1,
                        -1,
                    );
                    const otherCandidateDisplay = `${fileName} (${otherSuffixParts.join('/')})`;

                    return candidateDisplay === otherCandidateDisplay;
                });

                if (conflictingTabs.length === 0) {
                    return candidateDisplay;
                }
            }

            // If still not unique, show the full path (fallback)
            const fullPath = currentPathParts.slice(0, -1).join('/');
            return fullPath ? `${fileName} (${fullPath})` : fileName;
        },
        [openTabs],
    );

    const openFile = useCallback(
        (file: FileNode) => {
            const existingTab = openTabs.find((tab) => tab.id === file.id);
            if (existingTab) {
                setActiveTabId(file.id);
                return;
            }

            const projectFile = files.find((f) => f.id === file.id);
            if (!projectFile) return;

            // Expand folders for the opened file path
            expandFoldersForPath(file.path);

            const newTab: OpenTab = {
                id: file.id,
                name: file.name,
                path: file.path,
                content: projectFile.content || '',
                language:
                    projectFile.language || getLanguageFromPath(file.path),
                isDirty: false,
            };

            setOpenTabs((prev) => [...prev, newTab]);
            setActiveTabId(file.id);
        },
        [openTabs, files, expandFoldersForPath, getLanguageFromPath],
    );

    const closeTab = (tabId: string) => {
        const tab = openTabs.find((t) => t.id === tabId);
        if (tab?.isDirty) {
            setConfirmAction(() => () => performCloseTab(tabId));
            setIsConfirmModalOpen(true);
            return;
        }
        performCloseTab(tabId);
    };

    const performCloseTab = (tabId: string) => {
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

                // 에러 메시지 파싱 및 사용자 친화적 메시지 표시
                let errorMessage = '파일 저장에 실패했습니다.';

                if (error instanceof Error) {
                    // HTTP 409 Conflict 또는 파일 중복 관련 에러
                    if (
                        error.message.includes('already exists') ||
                        error.message.includes('Conflict') ||
                        error.message.includes('409') ||
                        error.message.includes('이미 존재')
                    ) {
                        errorMessage = `이미 "${tab.path}" 파일이 존재합니다. 다른 파일명을 사용해주세요.`;
                    }
                    // HTTP 400 Bad Request 또는 유효성 검증 에러
                    else if (
                        error.message.includes(
                            'File path contains invalid characters',
                        ) ||
                        error.message.includes('특수문자') ||
                        error.message.includes('400')
                    ) {
                        errorMessage =
                            '파일 경로에 사용할 수 없는 문자가 포함되어 있습니다.';
                    }
                    // HTTP 403 Forbidden 또는 권한 에러
                    else if (
                        error.message.includes('permission') ||
                        error.message.includes('권한') ||
                        error.message.includes('403') ||
                        error.message.includes('Forbidden')
                    ) {
                        errorMessage = '파일 저장 권한이 없습니다.';
                    }
                    // HTTP 413 Payload Too Large
                    else if (
                        error.message.includes('413') ||
                        error.message.includes('too large') ||
                        error.message.includes('파일이 너무')
                    ) {
                        errorMessage = '파일 크기가 너무 큽니다.';
                    }
                }

                setAlertMessage(errorMessage);
                setIsAlertModalOpen(true);
                throw error;
            }
        },
        [openTabs, activeTabId, onFileCreate, onFileUpdate],
    );

    // Function to apply review decorations for a specific file
    const applyReviewDecorations = useCallback(
        async (reviewResult: CodeReviewResult, targetTab?: OpenTab) => {
            if (!editorRef.current || !reviewResult) return;

            const tab = targetTab || activeTab;
            if (!tab) return;

            const monaco = await import('monaco-editor');
            const editor = editorRef.current;
            const decorations: editor.IModelDeltaDecoration[] = [];
            const markers: editor.IMarkerData[] = [];

            // Convert review issues to Monaco decorations and markers
            reviewResult.issues.forEach((issue) => {
                const severity = {
                    critical: monaco.MarkerSeverity.Error,
                    high: monaco.MarkerSeverity.Error,
                    medium: monaco.MarkerSeverity.Warning,
                    low: monaco.MarkerSeverity.Warning,
                    info: monaco.MarkerSeverity.Info,
                }[issue.severity];

                // Add marker for problems panel
                markers.push({
                    severity,
                    startLineNumber: issue.line,
                    startColumn: issue.column || 1,
                    endLineNumber: issue.line,
                    endColumn: issue.column ? issue.column + 1 : 2,
                    message: `${issue.title}: ${issue.description}`,
                });

                // Add decoration for editor highlighting
                const decorationClass = {
                    critical: 'ai-review-decoration-critical',
                    high: 'ai-review-decoration-high',
                    medium: 'ai-review-decoration-medium',
                    low: 'ai-review-decoration-low',
                    info: 'ai-review-decoration-info',
                }[issue.severity];

                decorations.push({
                    range: new monaco.Range(
                        issue.line,
                        issue.column || 1,
                        issue.line,
                        issue.column ? issue.column + 1 : 2,
                    ),
                    options: {
                        className: decorationClass,
                        hoverMessage: {
                            value: `**${issue.title}**\n\n${issue.description}${issue.suggestion ? `\n\n💡 **제안사항:**\n${issue.suggestion}` : ''}`,
                        },
                        minimap: {
                            color: {
                                critical: '#ef4444',
                                high: '#f97316',
                                medium: '#eab308',
                                low: '#3b82f6',
                                info: '#06b6d4',
                            }[issue.severity],
                            position: monaco.editor.MinimapPosition.Inline,
                        },
                    },
                });
            });

            // Apply decorations
            const model = editor.getModel();
            if (model) {
                editor.deltaDecorations([], decorations);
                monaco.editor.setModelMarkers(model, 'ai-review', markers);
            }
        },
        [activeTab],
    );

    const handleOpenReviewPanel = useCallback(async () => {
        // Just open the panel to show current progress or existing results
        setIsReviewPanelOpen(true);

        // Apply decorations if we have review results for current file
        if (currentFileReview && activeTab) {
            await applyReviewDecorations(currentFileReview, activeTab);
        }
    }, [currentFileReview, activeTab, applyReviewDecorations]);

    const handleStartNewReview = useCallback(() => {
        if (!activeTab) {
            setAlertMessage('리뷰할 파일을 선택해주세요.');
            setIsAlertModalOpen(true);
            return;
        }

        if (!activeTab.content.trim()) {
            setAlertMessage('빈 파일은 리뷰할 수 없습니다.');
            setIsAlertModalOpen(true);
            return;
        }

        if (!isReviewSocketConnected) {
            setAlertMessage(
                'AI 리뷰 서비스에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.',
            );
            setIsAlertModalOpen(true);
            return;
        }

        const language =
            activeTab.language ||
            getLanguageFromPath(activeTab.path) ||
            'typescript';

        const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        startReview({
            requestId,
            projectId,
            code: activeTab.content,
            language,
            filePath: activeTab.path,
            context: `Project: ${projectId}, File: ${activeTab.path}`,
        });

        setIsReviewPanelOpen(true);
        clearReviewState(); // Clear previous state
    }, [
        activeTab,
        projectId,
        startReview,
        isReviewSocketConnected,
        getLanguageFromPath,
        clearReviewState,
    ]);

    // Update editor decorations when review results change
    useEffect(() => {
        if (!editorRef.current || !currentFileReview || !activeTab) return;

        const updateDecorations = async () => {
            const monaco = await import('monaco-editor');
            const editor = editorRef.current!;
            const decorations: editor.IModelDeltaDecoration[] = [];
            const markers: editor.IMarkerData[] = [];

            // Convert review issues to Monaco decorations and markers
            currentFileReview.issues.forEach((issue) => {
                const severity = {
                    critical: monaco.MarkerSeverity.Error,
                    high: monaco.MarkerSeverity.Error,
                    medium: monaco.MarkerSeverity.Warning,
                    low: monaco.MarkerSeverity.Info,
                    info: monaco.MarkerSeverity.Info,
                }[issue.severity];

                // Add marker for problems panel
                markers.push({
                    severity,
                    startLineNumber: issue.line,
                    startColumn: issue.column || 1,
                    endLineNumber: issue.line,
                    endColumn: issue.column
                        ? issue.column + 1
                        : Number.MAX_SAFE_INTEGER,
                    message: `${issue.title}: ${issue.description}`,
                    source: 'AI Review',
                });

                // Add decoration for inline display
                const decorationClass = {
                    critical: 'ai-review-decoration-critical',
                    high: 'ai-review-decoration-high',
                    medium: 'ai-review-decoration-medium',
                    low: 'ai-review-decoration-low',
                    info: 'ai-review-decoration-info',
                }[issue.severity];

                decorations.push({
                    range: new monaco.Range(
                        issue.line,
                        issue.column || 1,
                        issue.line,
                        issue.column
                            ? issue.column + 1
                            : Number.MAX_SAFE_INTEGER,
                    ),
                    options: {
                        className: decorationClass,
                        hoverMessage: {
                            value: `**${issue.title}** (${issue.severity})\n\n${issue.description}${
                                issue.suggestion
                                    ? `\n\n💡 **제안:** ${issue.suggestion}`
                                    : ''
                            }`,
                            isTrusted: true,
                        },
                        minimap: {
                            color:
                                severity === monaco.MarkerSeverity.Error
                                    ? '#ff0000'
                                    : severity === monaco.MarkerSeverity.Warning
                                      ? '#ff8c00'
                                      : '#00bfff',
                            position: monaco.editor.MinimapPosition.Inline,
                        },
                    },
                });
            });

            // Apply decorations
            const model = editor.getModel();
            if (model) {
                const decorationIds = editor.deltaDecorations([], decorations);
                monaco.editor.setModelMarkers(model, 'ai-review', markers);

                // Clean up decorations when component unmounts or review changes
                return () => {
                    editor.deltaDecorations(decorationIds, []);
                    monaco.editor.setModelMarkers(model, 'ai-review', []);
                };
            }
        };

        updateDecorations();
    }, [currentFileReview, activeTab]);

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
        setNewFileInitialPath('');
        setIsNewFileModalOpen(true);
    };

    const createNewFileInFolder = (folderPath: string) => {
        setNewFileInitialPath(folderPath + '/');
        setIsNewFileModalOpen(true);
    };

    const handleFileRename = async (file: FileNode, newPath: string) => {
        try {
            if (file.type === 'folder') {
                // 폴더 이름 변경
                if (onFolderRename) {
                    await onFolderRename(file.path, newPath);

                    // Update open tabs if any files in the renamed folder are open
                    const oldPathPrefix = file.path.endsWith('/')
                        ? file.path
                        : file.path + '/';
                    const newPathPrefix = newPath.endsWith('/')
                        ? newPath
                        : newPath + '/';

                    setOpenTabs((prev) =>
                        prev.map((tab) => {
                            if (tab.path.startsWith(oldPathPrefix)) {
                                const newTabPath = tab.path.replace(
                                    oldPathPrefix,
                                    newPathPrefix,
                                );
                                return {
                                    ...tab,
                                    name:
                                        newTabPath.split('/').pop() ||
                                        newTabPath,
                                    path: newTabPath,
                                };
                            }
                            return tab;
                        }),
                    );
                }
            } else {
                // 파일 이름 변경
                if (onFileRename) {
                    await onFileRename(file.id, newPath);
                    // Update open tabs if the renamed file is open
                    setOpenTabs((prev) =>
                        prev.map((tab) =>
                            tab.id === file.id
                                ? {
                                      ...tab,
                                      name: newPath.split('/').pop() || newPath,
                                      path: newPath,
                                  }
                                : tab,
                        ),
                    );
                }
            }
        } catch (error) {
            console.error('이름 변경 실패:', error);

            let errorMessage = `${
                file.type === 'folder' ? '폴더' : '파일'
            } 이름 변경에 실패했습니다.`;
            if (error instanceof Error) {
                if (
                    error.message.includes('already exists') ||
                    error.message.includes('Conflict') ||
                    error.message.includes('409')
                ) {
                    errorMessage = `이미 "${newPath}" ${
                        file.type === 'folder' ? '폴더' : '파일'
                    }이 존재합니다. 다른 이름을 사용해주세요.`;
                }
            }

            setAlertMessage(errorMessage);
            setIsAlertModalOpen(true);
        }
    };

    const handleCreateNewFile = (filePath: string, language?: string) => {
        // 중복 파일 경로 체크
        const existingFile = files.find((file) => file.path === filePath);
        const existingTab = openTabs.find((tab) => tab.path === filePath);

        if (existingFile || existingTab) {
            setAlertMessage(
                `이미 "${filePath}" 파일이 존재합니다. 다른 파일명을 사용해주세요.`,
            );
            setIsAlertModalOpen(true);
            return;
        }

        // 파일 경로에서 파일명 추출
        const fileName = filePath.split('/').pop() || filePath;

        const newTab: OpenTab = {
            id: `new-${Date.now()}`,
            name: fileName,
            path: filePath,
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

                // Expand folders for all restored tabs
                validTabs.forEach((tab) => {
                    expandFoldersForPath(tab.path);
                });

                // Restore active tab if it exists in valid tabs
                const activeTab = validTabs.find(
                    (tab) => tab.id === sessionData.activeTabId,
                );
                setActiveTabId(activeTab ? sessionData.activeTabId : null);
            } else {
                // No session data - start with all folders collapsed
                setExpandedFolders(new Set());
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
        expandFoldersForPath,
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

    // Auto-open file from URL query parameter
    useEffect(() => {
        const fileId = searchParams.get('file');
        if (fileId && files.length > 0 && isSessionLoaded) {
            const targetFile = files.find((file) => file.id === fileId);
            if (targetFile) {
                // Check if file is already open
                const existingTab = openTabs.find((tab) => tab.id === fileId);
                if (!existingTab) {
                    // Convert ProjectFile to FileNode format
                    const fileNode: FileNode = {
                        id: targetFile.id,
                        name:
                            targetFile.path.split('/').pop() || targetFile.path,
                        path: targetFile.path,
                        type: 'file',
                        children: [],
                        size: targetFile.size,
                        language: targetFile.language,
                        updated_at: targetFile.updated_at,
                    };
                    openFile(fileNode);
                }
                // Set as active tab if not already active
                if (activeTabId !== fileId) {
                    setActiveTabId(fileId);
                }

                // Clear the file parameter from URL to prevent repeated opening
                if (typeof window !== 'undefined') {
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('file');
                    router.replace(newUrl.pathname + newUrl.search, {
                        scroll: false,
                    });
                }
            }
        }
    }, [
        searchParams,
        files,
        isSessionLoaded,
        openTabs,
        activeTabId,
        openFile,
        router,
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

    // Save review result when completed
    useEffect(() => {
        if (reviewResult?.result && activeTab) {
            setCurrentFileReview(reviewResult.result);
        }
    }, [reviewResult, activeTab]);

    // Load previous review when switching files
    useEffect(() => {
        const loadPreviousReview = async () => {
            if (!activeTab || !activeTab.path) {
                setCurrentFileReview(null);
                return;
            }

            try {
                const response = await apiClient.get('/ai/review/latest', {
                    params: {
                        projectId,
                        filePath: activeTab.path,
                    },
                });

                if (response.data?.reviewResult) {
                    setCurrentFileReview(response.data.reviewResult);
                    // Auto-apply decorations when review data is loaded
                    await applyReviewDecorations(
                        response.data.reviewResult,
                        activeTab,
                    );
                } else {
                    setCurrentFileReview(null);
                }
            } catch {
                // No previous review found or error - that's okay
                setCurrentFileReview(null);
            }
        };

        loadPreviousReview();
    }, [activeTabId, projectId, applyReviewDecorations, activeTab]);

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
                                        onNewFileInFolder={
                                            createNewFileInFolder
                                        }
                                        onFileRename={handleFileRename}
                                        expandedFolders={expandedFolders}
                                        onToggleFolder={(path) => {
                                            setExpandedFolders((prev) => {
                                                const newSet = new Set(prev);
                                                if (newSet.has(path)) {
                                                    newSet.delete(path);
                                                } else {
                                                    newSet.add(path);
                                                }
                                                return newSet;
                                            });
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
                    <div className="ml-auto flex items-center space-x-2">
                        {activeTab && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenReviewPanel}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none hover:from-blue-700 hover:to-purple-700"
                            >
                                <Sparkles className="h-4 w-4 mr-1" />
                                AI 리뷰
                            </Button>
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
                                    'flex items-center px-3 py-2 border-r cursor-pointer min-w-[120px] max-w-[200px]',
                                    activeTabId === tab.id
                                        ? 'bg-white border-b-2 border-blue-500'
                                        : 'hover:bg-gray-50',
                                )}
                                onClick={async () => {
                                    // Clear AI review decorations when switching tabs
                                    if (editorRef.current) {
                                        const monaco = await import(
                                            'monaco-editor'
                                        );
                                        const editor = editorRef.current;
                                        const model = editor.getModel();
                                        if (model) {
                                            // Clear only AI review markers
                                            monaco.editor.setModelMarkers(
                                                model,
                                                'ai-review',
                                                [],
                                            );

                                            // Clear AI review decorations by finding and removing them
                                            const allDecorations =
                                                model.getAllDecorations();
                                            const aiReviewDecorations =
                                                allDecorations.filter((d) =>
                                                    d.options.className?.includes(
                                                        'ai-review-decoration',
                                                    ),
                                                );
                                            if (
                                                aiReviewDecorations.length > 0
                                            ) {
                                                editor.deltaDecorations(
                                                    aiReviewDecorations.map(
                                                        (d) => d.id,
                                                    ),
                                                    [],
                                                );
                                            }
                                        }
                                    }

                                    // Clear current file review state immediately
                                    setCurrentFileReview(null);

                                    // Switch to new tab
                                    setActiveTabId(tab.id);

                                    // The existing useEffect will handle loading review data for the new file
                                }}
                                title={tab.path} // Show full path on hover
                            >
                                <File className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="text-sm truncate">
                                    {getTabDisplayName(tab)}
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
                key={`${newFileInitialPath}-${files.length}-${openTabs.length}`}
                open={isNewFileModalOpen}
                onOpenChange={setIsNewFileModalOpen}
                onConfirm={handleCreateNewFile}
                initialPath={newFileInitialPath}
                existingPaths={[
                    ...files.map((file) => file.path),
                    ...openTabs.map((tab) => tab.path),
                ]}
            />

            {/* Confirm Modal */}
            <ConfirmModal
                open={isConfirmModalOpen}
                onOpenChange={setIsConfirmModalOpen}
                onConfirm={() => {
                    if (confirmAction) {
                        confirmAction();
                        setConfirmAction(null);
                    }
                }}
                title="변경사항 손실 경고"
                description="저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?"
                confirmText="닫기"
                cancelText="취소"
                variant="destructive"
            />

            {/* Alert Modal */}
            <AlertModal
                open={isAlertModalOpen}
                onOpenChange={setIsAlertModalOpen}
                title="파일 저장 오류"
                description={alertMessage}
                confirmText="확인"
            />

            {/* AI Code Review Panel */}
            <CodeReviewPanel
                isOpen={isReviewPanelOpen}
                onClose={() => {
                    // Just close the panel, let review continue in background
                    setIsReviewPanelOpen(false);
                }}
                result={currentFileReview || reviewResult?.result || null}
                isLoading={!!currentProgress}
                onRequestReview={handleStartNewReview}
                currentProgress={currentProgress}
                error={reviewError}
                onCancel={
                    currentProgress
                        ? () => cancelReview(currentProgress.requestId)
                        : undefined
                }
            />
        </div>
    );
}
