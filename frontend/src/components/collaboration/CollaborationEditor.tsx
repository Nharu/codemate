'use client';

import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useCollaboration } from '@/hooks/useCollaboration';

interface CollaborationEditorProps {
    roomId: string;
    token: string;
    initialContent?: string;
    language?: string;
    onContentChange?: (content: string) => void;
}

export function CollaborationEditor({
    roomId,
    token,
    initialContent = '',
    language = 'javascript',
    onContentChange,
}: CollaborationEditorProps) {
    const [editorContent, setEditorContent] = useState(initialContent);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
    const cursorDecorations = useRef<string[]>([]);

    const {
        isConnected,
        users,
        cursors,
        joinRoom,
        leaveRoom,
        sendCursorMove,
        sendTextChange,
    } = useCollaboration(token);

    useEffect(() => {
        if (isConnected && roomId) {
            joinRoom(roomId);
            return () => {
                leaveRoom(roomId);
            };
        }
    }, [isConnected, roomId, joinRoom, leaveRoom]);

    const handleEditorDidMount = (
        editorInstance: editor.IStandaloneCodeEditor,
        monaco: typeof import('monaco-editor'),
    ) => {
        editorRef.current = editorInstance;
        monacoRef.current = monaco;

        // Handle cursor position changes
        editorInstance.onDidChangeCursorPosition((e) => {
            if (roomId) {
                const position = {
                    line: e.position.lineNumber,
                    column: e.position.column,
                };

                const selection = editorInstance.getSelection();
                const selectionData =
                    selection && !selection.isEmpty()
                        ? {
                              startLine: selection.startLineNumber,
                              startColumn: selection.startColumn,
                              endLine: selection.endLineNumber,
                              endColumn: selection.endColumn,
                          }
                        : undefined;

                sendCursorMove(roomId, position, selectionData);
            }
        });

        // Handle content changes
        editorInstance.onDidChangeModelContent((e) => {
            const content = editorInstance.getValue();
            setEditorContent(content);
            onContentChange?.(content);

            if (roomId && e.changes.length > 0) {
                const changes = e.changes.map((change) => ({
                    range: {
                        startLine: change.range.startLineNumber,
                        startColumn: change.range.startColumn,
                        endLine: change.range.endLineNumber,
                        endColumn: change.range.endColumn,
                    },
                    text: change.text,
                }));

                sendTextChange(roomId, changes, 1); // Version handling will be improved in document sync
            }
        });
    };

    // Update cursor decorations when other users move their cursors
    useEffect(() => {
        if (!editorRef.current || !monacoRef.current) return;

        const decorations: editor.IModelDeltaDecoration[] = [];
        const userColors = [
            '#ff6b6b',
            '#4ecdc4',
            '#45b7d1',
            '#f9ca24',
            '#f0932b',
            '#eb4d4b',
        ];

        cursors.forEach((cursorData, userId) => {
            const user = users.find((u) => u.userId === userId);
            if (!user) return;

            const userIndex =
                users.findIndex((u) => u.userId === userId) % userColors.length;
            const color = userColors[userIndex];

            // Cursor decoration
            decorations.push({
                range: new monacoRef.current!.Range(
                    cursorData.position.line,
                    cursorData.position.column,
                    cursorData.position.line,
                    cursorData.position.column,
                ),
                options: {
                    className: `collaboration-cursor-${userId}`,
                    afterContentClassName: `collaboration-cursor-label-${userId}`,
                    stickiness: 1,
                },
            });

            // Selection decoration
            if (cursorData.selection) {
                decorations.push({
                    range: new monacoRef.current!.Range(
                        cursorData.selection.startLine,
                        cursorData.selection.startColumn,
                        cursorData.selection.endLine,
                        cursorData.selection.endColumn,
                    ),
                    options: {
                        className: `collaboration-selection-${userId}`,
                        stickiness: 1,
                    },
                });
            }

            // Inject CSS for user-specific colors
            const styleId = `collaboration-style-${userId}`;
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.innerHTML = `
                    .collaboration-cursor-${userId} {
                        border-left: 2px solid ${color};
                        position: relative;
                    }
                    .collaboration-cursor-label-${userId}::after {
                        content: "${user.username}";
                        position: absolute;
                        top: -20px;
                        left: 0;
                        background: ${color};
                        color: white;
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-size: 12px;
                        white-space: nowrap;
                        z-index: 1000;
                    }
                    .collaboration-selection-${userId} {
                        background: ${color}33;
                    }
                `;
                document.head.appendChild(style);
            }
        });

        cursorDecorations.current = editorRef.current.deltaDecorations(
            cursorDecorations.current,
            decorations,
        );
    }, [cursors, users]);

    // Clean up styles when component unmounts
    useEffect(() => {
        return () => {
            users.forEach((user) => {
                const styleElement = document.getElementById(
                    `collaboration-style-${user.userId}`,
                );
                if (styleElement) {
                    styleElement.remove();
                }
            });
        };
    }, [users]);

    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex-1">
                <Editor
                    height="100%"
                    language={language}
                    value={editorContent}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: true },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollbar: {
                            alwaysConsumeMouseWheel: false,
                        },
                        automaticLayout: true,
                        theme: 'vs-dark',
                    }}
                />
            </div>

            {/* Connection status indicator */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm">
                <div className="flex items-center space-x-2">
                    <div
                        className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>

                {/* Active users */}
                <div className="flex items-center space-x-2">
                    <span>
                        {users.length} user{users.length !== 1 ? 's' : ''}{' '}
                        online
                    </span>
                    <div className="flex -space-x-1">
                        {users.slice(0, 5).map((user, index) => (
                            <div
                                key={user.userId}
                                className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800"
                                title={user.username}
                                style={{
                                    backgroundColor: [
                                        '#ff6b6b',
                                        '#4ecdc4',
                                        '#45b7d1',
                                        '#f9ca24',
                                        '#f0932b',
                                    ][index % 5],
                                    color: 'white',
                                }}
                            >
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {users.length > 5 && (
                            <div className="w-6 h-6 rounded-full bg-gray-400 dark:bg-gray-500 flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800">
                                +{users.length - 5}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
