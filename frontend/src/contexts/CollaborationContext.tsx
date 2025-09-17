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
import type { editor } from 'monaco-editor';

// Yjs types - using unknown temporarily until properly imported
type YDoc = unknown;
type YBinding = unknown & { destroy: () => void };

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

    // Status (always enabled in auto mode)
    isCollaborationEnabled: boolean;
    hasOtherUsers: boolean; // New: indicates if there are other users in current room

    // Yjs and Monaco binding
    setupMonacoBinding: (
        editor: editor.IStandaloneCodeEditor,
        roomId: string,
    ) => Promise<() => void>;
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
    const [isCollaborationEnabled] = useState(true); // Always enabled in auto mode
    const [hasOtherUsers, setHasOtherUsers] = useState(false);

    // Refs
    const socketRef = useRef<Socket | null>(null);
    const isInitializingRef = useRef(false);
    const ydocRef = useRef<YDoc | null>(null);
    const bindingRef = useRef<YBinding | null>(null);
    const providerRef = useRef<unknown | null>(null);
    const roomBindingsRef = useRef<Map<string, YBinding>>(new Map());

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
                isInitializingRef.current = false;
            });

            socket.on('disconnect', (_reason) => {
                setIsConnected(false);
                setConnectedUsers([]);
                setHasOtherUsers(false);
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
                    // Check if there are other users besides current user
                    setHasOtherUsers(data.users.length > 1);
                },
            );

            socket.on(
                'user-left',
                (data: { user: ConnectedUser; users: ConnectedUser[] }) => {
                    setConnectedUsers(data.users);
                    // Check if there are other users besides current user
                    setHasOtherUsers(data.users.length > 1);
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
    const _stopCollaboration = useCallback(() => {
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
        setConnectedUsers([]);
        setCurrentRoomId(null);
        setHasOtherUsers(false);
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

    // Setup Monaco editor binding with Yjs for real-time collaboration
    const setupMonacoBinding = useCallback(
        async (editor: editor.IStandaloneCodeEditor, roomId: string) => {
            if (!ydocRef.current || !socketRef.current) {
                console.warn('Yjs document or socket not initialized');
                return () => {};
            }

            // Check if binding already exists for this room
            if (roomBindingsRef.current.has(roomId)) {
                const existingBinding = roomBindingsRef.current.get(roomId);
                return () => {
                    if (existingBinding && existingBinding.destroy) {
                        existingBinding.destroy();
                        roomBindingsRef.current.delete(roomId);
                    }
                };
            }

            try {
                // Dynamically import Monaco binding and Yjs
                const [{ MonacoBinding }, Y] = await Promise.all([
                    import('y-monaco'),
                    import('yjs'),
                ]);

                // Now that we have the types, we can properly cast
                const ydoc = ydocRef.current as InstanceType<typeof Y.Doc>;
                const ytext = ydoc.getText(roomId);

                // Initialize Yjs text with Monaco content if it's empty and Monaco has content
                const currentContent = editor.getValue();
                if (ytext.length === 0 && currentContent.length > 0) {
                    ytext.insert(0, currentContent);
                }

                // Get Monaco model (should not be null at this point)
                const model = editor.getModel();
                if (!model) {
                    throw new Error('Monaco editor model is null');
                }

                // Create Monaco binding
                const binding = new MonacoBinding(
                    ytext,
                    model,
                    new Set([editor]),
                    null, // No awareness for now
                );

                // Store the binding
                roomBindingsRef.current.set(roomId, binding as YBinding);

                // Setup Yjs update handler to send changes via WebSocket
                const updateHandler = (update: Uint8Array, origin: unknown) => {
                    // Only send updates that didn't come from WebSocket
                    if (origin !== 'websocket' && socketRef.current) {
                        socketRef.current.emit('yjs-update', {
                            roomId,
                            update: Array.from(update),
                        });
                    }
                };

                ydoc.on('update', updateHandler);

                // Setup WebSocket handler to receive updates
                const handleYjsUpdate = (data: {
                    roomId: string;
                    update: number[];
                }) => {
                    if (data.roomId === roomId) {
                        const update = new Uint8Array(data.update);
                        Y.applyUpdate(ydoc, update, 'websocket');
                    }
                };

                socketRef.current.on('yjs-update', handleYjsUpdate);

                // Return cleanup function
                return () => {
                    if (binding && binding.destroy) {
                        binding.destroy();
                    }
                    roomBindingsRef.current.delete(roomId);
                    ydoc?.off('update', updateHandler);
                    socketRef.current?.off('yjs-update', handleYjsUpdate);
                };
            } catch (error) {
                console.error('Failed to setup Monaco binding:', error);
                return () => {};
            }
        },
        [],
    );

    // Auto-start collaboration when session is available
    useEffect(() => {
        if (
            session?.accessToken &&
            !socketRef.current &&
            !isInitializingRef.current
        ) {
            startCollaboration();
        }
    }, [session?.accessToken, startCollaboration]);

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
        isCollaborationEnabled,
        hasOtherUsers,
        setupMonacoBinding,
    };

    return (
        <CollaborationContext.Provider value={value}>
            {children}
        </CollaborationContext.Provider>
    );
};
