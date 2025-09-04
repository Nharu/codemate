'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
    CollaborationState,
    ConnectedUser,
    CursorPosition,
    TextSelection,
    TextChange,
    ChatMessage,
} from '@/types/collaboration';

export function useCollaboration(token: string | null) {
    const [state, setState] = useState<CollaborationState>({
        isConnected: false,
        room: null,
        users: [],
        cursors: new Map(),
        chatMessages: [],
    });

    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!token) return;

        const socket = io('http://localhost:3001', {
            auth: { token },
            transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setState((prev) => ({ ...prev, isConnected: true }));
        });

        socket.on('disconnect', () => {
            setState((prev) => ({
                ...prev,
                isConnected: false,
                room: null,
                users: [],
                cursors: new Map(),
            }));
        });

        socket.on(
            'user-joined',
            ({ users }: { user: ConnectedUser; users: ConnectedUser[] }) => {
                setState((prev) => ({
                    ...prev,
                    users,
                    room: prev.room ? { ...prev.room, users } : null,
                }));
            },
        );

        socket.on(
            'user-left',
            ({
                user,
                users,
            }: {
                user: ConnectedUser;
                users: ConnectedUser[];
            }) => {
                setState((prev) => {
                    const newCursors = new Map(prev.cursors);
                    newCursors.delete(user.userId);
                    return {
                        ...prev,
                        users,
                        cursors: newCursors,
                        room: prev.room ? { ...prev.room, users } : null,
                    };
                });
            },
        );

        socket.on(
            'cursor-moved',
            ({
                userId,
                position,
                selection,
            }: {
                userId: string;
                username: string;
                position: CursorPosition;
                selection?: TextSelection;
            }) => {
                setState((prev) => {
                    const newCursors = new Map(prev.cursors);
                    newCursors.set(userId, { position, selection });
                    return { ...prev, cursors: newCursors };
                });
            },
        );

        socket.on(
            'text-changed',
            (_data: {
                userId: string;
                username: string;
                changes: TextChange[];
                versionId: number;
            }) => {
                // This will be handled by the document synchronization component
            },
        );

        socket.on('chat-message', (message: ChatMessage) => {
            setState((prev) => ({
                ...prev,
                chatMessages: [...prev.chatMessages, message],
            }));
        });

        return () => {
            socket.disconnect();
        };
    }, [token]);

    const joinRoom = async (roomId: string) => {
        if (!socketRef.current) return;

        return new Promise<{
            success: boolean;
            users?: ConnectedUser[];
            error?: string;
        }>((resolve) => {
            socketRef.current!.emit(
                'join-room',
                { roomId },
                (response: {
                    success: boolean;
                    users?: ConnectedUser[];
                    error?: string;
                }) => {
                    if (response.success) {
                        setState((prev) => ({
                            ...prev,
                            room: { id: roomId, users: response.users || [] },
                            users: response.users || [],
                        }));
                    }
                    resolve(response);
                },
            );
        });
    };

    const leaveRoom = async (roomId: string) => {
        if (!socketRef.current) return;

        return new Promise<{ success: boolean; error?: string }>((resolve) => {
            socketRef.current!.emit(
                'leave-room',
                { roomId },
                (response: { success: boolean; error?: string }) => {
                    if (response.success) {
                        setState((prev) => ({
                            ...prev,
                            room: null,
                            users: [],
                            cursors: new Map(),
                        }));
                    }
                    resolve(response);
                },
            );
        });
    };

    const sendCursorMove = (
        roomId: string,
        position: CursorPosition,
        selection?: TextSelection,
    ) => {
        if (!socketRef.current) return;
        socketRef.current.emit('cursor-move', { roomId, position, selection });
    };

    const sendTextChange = (
        roomId: string,
        changes: TextChange[],
        versionId: number,
    ) => {
        if (!socketRef.current) return;
        socketRef.current.emit('text-change', { roomId, changes, versionId });
    };

    const sendChatMessage = (roomId: string, message: string) => {
        if (!socketRef.current) return;
        socketRef.current.emit('chat-message', { roomId, message });
    };

    return {
        ...state,
        joinRoom,
        leaveRoom,
        sendCursorMove,
        sendTextChange,
        sendChatMessage,
    };
}
