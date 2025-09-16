'use client';

import React, {
    createContext,
    useContext,
    useRef,
    useState,
    useCallback,
    useEffect,
} from 'react';
import { useSession } from 'next-auth/react';
import io, { type Socket } from 'socket.io-client';
import type { ConnectedUser } from '@/types/collaboration';

interface CollaborationContextType {
    // Socket connection state
    isConnected: boolean;
    isConnecting: boolean;
    socket: Socket | null;

    // Room state
    currentRoomId: string | null;
    connectedUsers: ConnectedUser[];

    // Actions
    joinRoom: (roomId: string) => void;
    leaveRoom: () => void;
    startCollaboration: () => void;
    stopCollaboration: () => void;

    // Status
    isCollaborationEnabled: boolean;
}

const CollaborationContext = createContext<CollaborationContextType | null>(
    null,
);

export const useCollaboration = () => {
    const context = useContext(CollaborationContext);
    if (!context) {
        throw new Error(
            'useCollaboration must be used within a CollaborationProvider',
        );
    }
    return context;
};

interface CollaborationProviderProps {
    children: React.ReactNode;
    projectId: string;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({
    children,
    projectId: _projectId,
}) => {
    const { data: session } = useSession();

    // State
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
    const [isCollaborationEnabled, setIsCollaborationEnabled] = useState(false);

    // Refs
    const socketRef = useRef<Socket | null>(null);
    const isInitializingRef = useRef(false);
    const ydocRef = useRef<unknown | null>(null);
    const bindingRef = useRef<unknown | null>(null);
    const providerRef = useRef<unknown | null>(null);

    // Start collaboration - create socket connection
    const startCollaboration = useCallback(async () => {
        if (!session?.accessToken) {
            return;
        }

        if (isInitializingRef.current || socketRef.current) {
            return;
        }

        try {
            setIsConnecting(true);
            isInitializingRef.current = true;

            // Dynamically import Yjs and Monaco binding
            const [Y, { MonacoBinding: _MonacoBinding }] = await Promise.all([
                import('yjs'),
                import('y-monaco'),
            ]);

            // Initialize Yjs document
            const ydoc = new Y.Doc();
            ydocRef.current = ydoc;

            // Create WebSocket connection
            const socket = io(
                `${process.env.NEXT_PUBLIC_API_URL}/collaboration`,
                {
                    auth: { token: session.accessToken },
                    forceNew: true,
                    autoConnect: true,
                    timeout: 10000,
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                },
            );

            socketRef.current = socket;

            // Setup event listeners
            socket.on('connect', () => {
                setIsConnected(true);
                setIsConnecting(false);
                setIsCollaborationEnabled(true);
                isInitializingRef.current = false;
            });

            socket.on('disconnect', (reason) => {
                setIsConnected(false);
                setConnectedUsers([]);
                if (reason !== 'io client disconnect') {
                    setIsCollaborationEnabled(false);
                }
                isInitializingRef.current = false;
            });

            socket.on('connect_error', (_error) => {
                setIsConnecting(false);
                isInitializingRef.current = false;
            });

            socket.on(
                'user-joined',
                (data: { user: ConnectedUser; users: ConnectedUser[] }) => {
                    setConnectedUsers(data.users);
                },
            );

            socket.on(
                'user-left',
                (data: { user: ConnectedUser; users: ConnectedUser[] }) => {
                    setConnectedUsers(data.users);
                },
            );

            // Add other collaboration event listeners here...
        } catch (error) {
            console.error('Failed to start collaboration:', error);
            setIsConnecting(false);
            isInitializingRef.current = false;
        }
    }, [session?.accessToken]);

    // Stop collaboration - disconnect socket
    const stopCollaboration = useCallback(() => {
        // Clean up Yjs bindings
        if (
            bindingRef.current &&
            typeof bindingRef.current === 'object' &&
            'destroy' in bindingRef.current
        ) {
            (bindingRef.current as { destroy: () => void }).destroy();
            bindingRef.current = null;
        }

        if (
            providerRef.current &&
            typeof providerRef.current === 'object' &&
            'destroy' in providerRef.current
        ) {
            (providerRef.current as { destroy: () => void }).destroy();
            providerRef.current = null;
        }

        // Disconnect socket
        if (socketRef.current) {
            if (currentRoomId) {
                socketRef.current.emit('leave-room', { roomId: currentRoomId });
            }
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        // Clean up Yjs document
        if (
            ydocRef.current &&
            typeof ydocRef.current === 'object' &&
            'destroy' in ydocRef.current
        ) {
            (ydocRef.current as { destroy: () => void }).destroy();
            ydocRef.current = null;
        }

        // Reset state
        setIsConnected(false);
        setIsConnecting(false);
        setIsCollaborationEnabled(false);
        setConnectedUsers([]);
        setCurrentRoomId(null);
        isInitializingRef.current = false;
    }, [currentRoomId]);

    // Join a specific room
    const joinRoom = useCallback(
        (roomId: string) => {
            if (!socketRef.current || !isConnected) {
                console.warn('Cannot join room: socket not connected');
                return;
            }

            // Leave current room if different
            if (currentRoomId && currentRoomId !== roomId) {
                socketRef.current.emit('leave-room', { roomId: currentRoomId });
            }

            if (currentRoomId !== roomId) {
                setCurrentRoomId(roomId);
                socketRef.current.emit('join-room', { roomId });
            }
        },
        [currentRoomId, isConnected],
    );

    // Leave current room
    const leaveRoom = useCallback(() => {
        if (!socketRef.current || !currentRoomId) {
            return;
        }

        socketRef.current.emit('leave-room', { roomId: currentRoomId });
        setCurrentRoomId(null);
        setConnectedUsers([]);
    }, [currentRoomId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const value: CollaborationContextType = {
        isConnected,
        isConnecting,
        socket: socketRef.current,
        currentRoomId,
        connectedUsers,
        joinRoom,
        leaveRoom,
        startCollaboration,
        stopCollaboration,
        isCollaborationEnabled,
    };

    return (
        <CollaborationContext.Provider value={value}>
            {children}
        </CollaborationContext.Provider>
    );
};
