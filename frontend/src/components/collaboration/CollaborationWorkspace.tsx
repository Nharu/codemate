'use client';

import { useState } from 'react';
import { CollaborationEditor } from './CollaborationEditor';
import { ChatPanel } from './ChatPanel';
import { RoomSelector } from './RoomSelector';
import { useCollaboration } from '@/hooks/useCollaboration';

interface CollaborationWorkspaceProps {
    token: string;
    initialContent?: string;
    language?: string;
    onContentChange?: (content: string) => void;
}

export function CollaborationWorkspace({
    token,
    initialContent = '',
    language = 'javascript',
    onContentChange,
}: CollaborationWorkspaceProps) {
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(true);
    const { isConnected, room } = useCollaboration(token);

    const handleRoomSelect = (roomId: string) => {
        setCurrentRoomId(roomId);
    };

    const handleLeaveRoom = () => {
        setCurrentRoomId(null);
    };

    if (!currentRoomId) {
        return (
            <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <RoomSelector
                        onRoomSelect={handleRoomSelect}
                        isConnected={isConnected}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            CodeMate Collaboration
                        </h1>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>Room:</span>
                            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-white">
                                {currentRoomId}
                            </code>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            {showChat ? 'Hide Chat' : 'Show Chat'}
                        </button>
                        <button
                            onClick={handleLeaveRoom}
                            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                            Leave Room
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Editor section */}
                <div className={`flex-1 ${showChat ? 'pr-0' : 'pr-0'}`}>
                    <CollaborationEditor
                        roomId={currentRoomId}
                        token={token}
                        initialContent={initialContent}
                        language={language}
                        onContentChange={onContentChange}
                    />
                </div>

                {/* Chat panel */}
                {showChat && (
                    <div className="w-80 flex-shrink-0">
                        <ChatPanel roomId={currentRoomId} token={token} />
                    </div>
                )}
            </div>

            {/* Status bar */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-2">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                        <span>Language: {language}</span>
                        {room && (
                            <span>
                                {room.users.length} collaborator
                                {room.users.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <div
                            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                        />
                        <span>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
