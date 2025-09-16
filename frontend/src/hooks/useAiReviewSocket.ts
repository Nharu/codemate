import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import type { CodeReviewResult } from '@/components/ai/CodeReviewPanel';

export interface AiReviewRequest {
    requestId: string;
    projectId: string;
    code: string;
    language: string;
    filePath?: string;
    context?: string;
}

export interface ReviewProgress {
    requestId: string;
    stage: 'initializing' | 'analyzing' | 'finalizing';
    message: string;
    progress: number;
}

export interface ReviewResult {
    requestId: string;
    result: CodeReviewResult;
    progress: number;
}

export interface ReviewError {
    requestId: string;
    message: string;
}

interface UseAiReviewSocketReturn {
    isConnected: boolean;
    startReview: (request: AiReviewRequest) => void;
    cancelReview: (requestId: string) => void;
    currentProgress: ReviewProgress | null;
    lastResult: ReviewResult | null;
    lastError: ReviewError | null;
    clearState: () => void;
}

export const useAiReviewSocket = (): UseAiReviewSocketReturn => {
    const { data: session } = useSession();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentProgress, setCurrentProgress] =
        useState<ReviewProgress | null>(null);
    const [lastResult, setLastResult] = useState<ReviewResult | null>(null);
    const [lastError, setLastError] = useState<ReviewError | null>(null);

    // Initialize socket connection
    useEffect(() => {
        if (!session?.accessToken) {
            return;
        }

        const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/ai-review`, {
            auth: { token: session.accessToken },
            autoConnect: true,
        });

        socketRef.current = socket;

        const handleConnect = (): void => {
            setIsConnected(true);
        };

        const handleDisconnect = (): void => {
            setIsConnected(false);
        };

        const handleAuthSuccess = (): void => {
            console.log('AI Review socket authenticated');
        };

        const handleAuthError = (): void => {
            setIsConnected(false);
            console.error('AI Review socket authentication failed');
        };

        const handleReviewProgress = (progress: ReviewProgress): void => {
            setCurrentProgress(progress);
            setLastError(null); // Clear any previous errors
        };

        const handleReviewCompleted = (result: ReviewResult): void => {
            setLastResult(result);
            setCurrentProgress(null);
            setLastError(null);
        };

        const handleReviewError = (error: ReviewError): void => {
            setLastError(error);
            setCurrentProgress(null);
        };

        const handleReviewCancelled = (data: { requestId: string }): void => {
            setCurrentProgress(null);
            setLastError(null);
            console.log('Review cancelled:', data.requestId);
        };

        // Register event handlers
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('auth:success', handleAuthSuccess);
        socket.on('auth:error', handleAuthError);
        socket.on('review:progress', handleReviewProgress);
        socket.on('review:completed', handleReviewCompleted);
        socket.on('review:error', handleReviewError);
        socket.on('review:cancelled', handleReviewCancelled);

        return (): void => {
            socket.disconnect();
        };
    }, [session?.accessToken]);

    const startReview = useCallback(
        (request: AiReviewRequest): void => {
            if (socketRef.current && isConnected) {
                // Clear previous state
                setCurrentProgress(null);
                setLastResult(null);
                setLastError(null);

                socketRef.current.emit('review:start', request);
            }
        },
        [isConnected],
    );

    const cancelReview = useCallback(
        (requestId: string): void => {
            if (socketRef.current && isConnected) {
                socketRef.current.emit('review:cancel', { requestId });
            }
        },
        [isConnected],
    );

    const clearState = useCallback((): void => {
        setCurrentProgress(null);
        setLastResult(null);
        setLastError(null);
    }, []);

    return {
        isConnected,
        startReview,
        cancelReview,
        currentProgress,
        lastResult,
        lastError,
        clearState,
    };
};
