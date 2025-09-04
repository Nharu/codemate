'use client';

import { useState } from 'react';
import { Users, Copy, Check } from 'lucide-react';

interface RoomSelectorProps {
    onRoomSelect: (roomId: string) => void;
    currentRoomId?: string;
    isConnected: boolean;
}

export function RoomSelector({
    onRoomSelect,
    currentRoomId,
    isConnected,
}: RoomSelectorProps) {
    const [roomId, setRoomId] = useState(currentRoomId || '');
    const [copied, setCopied] = useState(false);

    const generateRoomId = () => {
        const id = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomId(id);
        return id;
    };

    const handleJoinRoom = () => {
        if (!roomId.trim()) {
            const id = generateRoomId();
            onRoomSelect(id);
        } else {
            onRoomSelect(roomId.trim().toUpperCase());
        }
    };

    const handleCopyRoomId = async () => {
        if (!roomId) return;

        try {
            await navigator.clipboard.writeText(roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy room ID:', err);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Collaboration Room
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {currentRoomId
                            ? `Currently in room: ${currentRoomId}`
                            : 'Join or create a room to start collaborating'}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label
                        htmlFor="roomId"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                        Room ID
                    </label>
                    <div className="flex space-x-2">
                        <input
                            id="roomId"
                            type="text"
                            value={roomId}
                            onChange={(e) =>
                                setRoomId(e.target.value.toUpperCase())
                            }
                            placeholder="Enter room ID or leave blank to create new"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            maxLength={10}
                        />
                        {roomId && (
                            <button
                                onClick={handleCopyRoomId}
                                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                title="Copy room ID"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                    <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                )}
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Room IDs are case-insensitive and will be converted to
                        uppercase
                    </p>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={handleJoinRoom}
                        disabled={!isConnected}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {roomId ? 'Join Room' : 'Create New Room'}
                    </button>
                    <button
                        onClick={generateRoomId}
                        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Generate ID
                    </button>
                </div>

                {!isConnected && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ Not connected to server. Please check your
                            connection.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
