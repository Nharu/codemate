import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export interface IdeSessionTab {
    id: string;
    name: string;
    path: string;
    language?: string;
    isNew?: boolean;
}

export interface IdeSessionState {
    openTabs: IdeSessionTab[];
    activeTabId: string | null;
    sidebarCollapsed: boolean;
    sidebarWidth: number;
}

interface UseIdeSessionSocketReturn {
    sessionData: IdeSessionState | null;
    isLoading: boolean;
    isConnected: boolean;
    updateSession: (session: IdeSessionState) => void;
    extendSession: () => void;
    deleteSession: () => void;
}

export const useIdeSessionSocket = (
    projectId: string,
): UseIdeSessionSocketReturn => {
    const { data: session } = useSession();
    const socketRef = useRef<Socket | null>(null);
    const [sessionData, setSessionData] = useState<IdeSessionState | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize socket connection
    useEffect(() => {
        if (!session?.accessToken || !projectId) return;

        const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/ide-session`, {
            auth: { token: session.accessToken },
            autoConnect: true,
        });

        socketRef.current = socket;

        const handleConnect = (): void => {
            console.log('IDE session socket connected');
            setIsConnected(true);
            socket.emit('session:get', { projectId });
        };

        const handleDisconnect = (): void => {
            console.log('IDE session socket disconnected');
            setIsConnected(false);
        };

        const handleSessionData = ({
            projectId: receivedProjectId,
            session: receivedSession,
        }: {
            projectId: string;
            session: IdeSessionState;
        }): void => {
            if (receivedProjectId === projectId) {
                setSessionData(receivedSession);
                setIsLoading(false);
            }
        };

        const handleSessionSaved = ({
            projectId: savedProjectId,
        }: {
            projectId: string;
        }): void => {
            if (savedProjectId === projectId) {
                console.log('Session saved successfully');
            }
        };

        const handleSessionExtended = ({
            projectId: extendedProjectId,
        }: {
            projectId: string;
        }): void => {
            if (extendedProjectId === projectId) {
                console.log('Session TTL extended');
            }
        };

        const handleSessionDeleted = ({
            projectId: deletedProjectId,
        }: {
            projectId: string;
        }): void => {
            if (deletedProjectId === projectId) {
                setSessionData(null);
                console.log('Session deleted');
            }
        };

        const handleSessionError = ({ message }: { message: string }): void => {
            console.error('IDE session error:', message);
            setIsLoading(false);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('session:data', handleSessionData);
        socket.on('session:saved', handleSessionSaved);
        socket.on('session:extended', handleSessionExtended);
        socket.on('session:deleted', handleSessionDeleted);
        socket.on('session:error', handleSessionError);

        return (): void => {
            socket.disconnect();
        };
    }, [session?.accessToken, projectId]);

    const updateSession = useCallback(
        (newSession: IdeSessionState): void => {
            if (socketRef.current && isConnected) {
                socketRef.current.emit('session:update', {
                    projectId,
                    session: newSession,
                });
            }
        },
        [projectId, isConnected],
    );

    const extendSession = useCallback((): void => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('session:extend', { projectId });
        }
    }, [projectId, isConnected]);

    const deleteSession = useCallback((): void => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('session:delete', { projectId });
        }
    }, [projectId, isConnected]);

    return {
        sessionData,
        isLoading,
        isConnected,
        updateSession,
        extendSession,
        deleteSession,
    };
};
