'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useCollaboration } from '@/hooks/useCollaboration';

interface ChatPanelProps {
    roomId: string;
    token: string;
    className?: string;
}

export function ChatPanel({ roomId, token, className = '' }: ChatPanelProps) {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { chatMessages, sendChatMessage, isConnected } =
        useCollaboration(token);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !isConnected) return;

        sendChatMessage(roomId, message);
        setMessage('');
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div
            className={`flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 ${className}`}
        >
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Chat
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isConnected ? 'Connected' : 'Disconnected'}
                </p>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                        <p>No messages yet</p>
                        <p className="text-sm">
                            Start a conversation with your collaborators
                        </p>
                    </div>
                ) : (
                    chatMessages.map((msg) => (
                        <div key={msg.id} className="flex flex-col space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {msg.username}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatTimestamp(msg.timestamp)}
                                </span>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                                <p className="text-sm text-gray-900 dark:text-white break-words">
                                    {msg.message}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-gray-200 dark:border-gray-700"
            >
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                            isConnected ? 'Type a message...' : 'Not connected'
                        }
                        disabled={!isConnected}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        maxLength={500}
                    />
                    <button
                        type="submit"
                        disabled={!isConnected || !message.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {message.length}/500 characters
                </div>
            </form>
        </div>
    );
}
