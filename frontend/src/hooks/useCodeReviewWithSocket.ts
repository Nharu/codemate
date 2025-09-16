import { useEffect } from 'react';
import { useAiReviewSocket } from './useAiReviewSocket';
import { useCodeReviewActions } from '@/store/codeReviewStore';

/**
 * Hook that integrates WebSocket events with Zustand store
 * This handles the automatic syncing between WebSocket and store
 */
export const useCodeReviewWithSocket = () => {
    const {
        isConnected,
        startReview: socketStartReview,
        cancelReview: socketCancelReview,
        currentProgress: globalProgress,
        lastResult: globalResult,
        lastError: globalError,
        clearState: clearSocketState,
    } = useAiReviewSocket();

    const { syncProgress, syncResult, syncError } = useCodeReviewActions();

    // Sync WebSocket progress to store
    useEffect(() => {
        if (globalProgress) {
            syncProgress(globalProgress);
        }
    }, [globalProgress, syncProgress]);

    // Sync WebSocket result to store
    useEffect(() => {
        if (globalResult) {
            syncResult(globalResult.requestId, globalResult.result);
        }
    }, [globalResult, syncResult]);

    // Sync WebSocket error to store
    useEffect(() => {
        if (globalError) {
            syncError(globalError);
        }
    }, [globalError, syncError]);

    return {
        isConnected,
        startReview: socketStartReview,
        cancelReview: socketCancelReview,
        clearSocketState,
    };
};
