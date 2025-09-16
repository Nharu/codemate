import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { CodeReviewResult } from '@/components/ai/CodeReviewPanel';

// Types
export interface ReviewProgress {
    requestId: string;
    stage: 'initializing' | 'analyzing' | 'finalizing';
    message: string;
    progress: number;
}

export interface ReviewError {
    requestId: string;
    message: string;
}

// File-specific review state
interface FileReviewState {
    result?: CodeReviewResult;
    progress?: ReviewProgress;
    error?: ReviewError;
    isLoading: boolean;
}

// Store state
interface CodeReviewStore {
    // State: filePath -> review state
    reviews: Record<string, FileReviewState>;

    // Current reviewing info
    currentReviewingFile: string | null;
    currentRequestId: string | null;

    // Getters
    getReviewState: (filePath: string) => FileReviewState;

    // Actions
    setReviewResult: (filePath: string, result: CodeReviewResult) => void;
    setReviewProgress: (filePath: string, progress: ReviewProgress) => void;
    setReviewError: (filePath: string, error: ReviewError) => void;
    clearReview: (filePath: string) => void;
    clearProgress: (filePath: string) => void;
    clearAll: (filePath: string) => void;

    // Review flow actions
    startReview: (filePath: string, requestId: string) => void;
    completeReview: (filePath: string) => void;
    cancelReview: (filePath: string) => void;

    // WebSocket sync actions
    syncProgress: (progress: ReviewProgress) => void;
    syncResult: (requestId: string, result: CodeReviewResult) => void;
    syncError: (error: ReviewError) => void;
}

export const useCodeReviewStore = create<CodeReviewStore>()(
    subscribeWithSelector(
        devtools(
            (set, get) => ({
                // Initial state
                reviews: {},
                currentReviewingFile: null,
                currentRequestId: null,

                // Getter for file review state
                getReviewState: (filePath: string): FileReviewState => {
                    const state = get().reviews[filePath];
                    return (
                        state || {
                            result: undefined,
                            progress: undefined,
                            error: undefined,
                            isLoading: false,
                        }
                    );
                },

                // Set review result
                setReviewResult: (
                    filePath: string,
                    result: CodeReviewResult,
                ) => {
                    set(
                        (state) => ({
                            reviews: {
                                ...state.reviews,
                                [filePath]: {
                                    ...state.reviews[filePath],
                                    result,
                                    progress: undefined,
                                    error: undefined,
                                    isLoading: false,
                                },
                            },
                        }),
                        false,
                        'setReviewResult',
                    );
                },

                // Set review progress
                setReviewProgress: (
                    filePath: string,
                    progress: ReviewProgress,
                ) => {
                    set(
                        (state) => ({
                            reviews: {
                                ...state.reviews,
                                [filePath]: {
                                    ...state.reviews[filePath],
                                    progress,
                                    error: undefined,
                                    isLoading: true,
                                },
                            },
                        }),
                        false,
                        'setReviewProgress',
                    );
                },

                // Set review error
                setReviewError: (filePath: string, error: ReviewError) => {
                    set(
                        (state) => ({
                            reviews: {
                                ...state.reviews,
                                [filePath]: {
                                    ...state.reviews[filePath],
                                    error,
                                    progress: undefined,
                                    isLoading: false,
                                },
                            },
                        }),
                        false,
                        'setReviewError',
                    );
                },

                // Clear review result
                clearReview: (filePath: string) => {
                    set(
                        (state) => ({
                            reviews: {
                                ...state.reviews,
                                [filePath]: {
                                    ...state.reviews[filePath],
                                    result: undefined,
                                },
                            },
                        }),
                        false,
                        'clearReview',
                    );
                },

                // Clear progress
                clearProgress: (filePath: string) => {
                    set(
                        (state) => ({
                            reviews: {
                                ...state.reviews,
                                [filePath]: {
                                    ...state.reviews[filePath],
                                    progress: undefined,
                                    isLoading: false,
                                },
                            },
                        }),
                        false,
                        'clearProgress',
                    );
                },

                // Clear all for file
                clearAll: (filePath: string) => {
                    set(
                        (state) => ({
                            reviews: {
                                ...state.reviews,
                                [filePath]: {
                                    result: undefined,
                                    progress: undefined,
                                    error: undefined,
                                    isLoading: false,
                                },
                            },
                        }),
                        false,
                        'clearAll',
                    );
                },

                // Start review
                startReview: (filePath: string, requestId: string) => {
                    set(
                        (state) => ({
                            currentReviewingFile: filePath,
                            currentRequestId: requestId,
                            reviews: {
                                ...state.reviews,
                                [filePath]: {
                                    result: undefined,
                                    progress: undefined,
                                    error: undefined,
                                    isLoading: true,
                                },
                            },
                        }),
                        false,
                        'startReview',
                    );
                },

                // Complete review
                completeReview: (filePath: string) => {
                    set(
                        (state) => ({
                            currentReviewingFile: null,
                            currentRequestId: null,
                            reviews: {
                                ...state.reviews,
                                [filePath]: {
                                    ...state.reviews[filePath],
                                    isLoading: false,
                                },
                            },
                        }),
                        false,
                        'completeReview',
                    );
                },

                // Cancel review
                cancelReview: (filePath: string) => {
                    set(
                        (state) => ({
                            currentReviewingFile: null,
                            currentRequestId: null,
                            reviews: {
                                ...state.reviews,
                                [filePath]: {
                                    ...state.reviews[filePath],
                                    progress: undefined,
                                    isLoading: false,
                                },
                            },
                        }),
                        false,
                        'cancelReview',
                    );
                },

                // WebSocket sync: Progress
                syncProgress: (progress: ReviewProgress) => {
                    const { currentReviewingFile, currentRequestId } = get();

                    if (
                        currentReviewingFile &&
                        currentRequestId === progress.requestId
                    ) {
                        get().setReviewProgress(currentReviewingFile, progress);
                    }
                },

                // WebSocket sync: Result
                syncResult: (requestId: string, result: CodeReviewResult) => {
                    const { currentReviewingFile, currentRequestId } = get();

                    if (
                        currentReviewingFile &&
                        currentRequestId === requestId
                    ) {
                        get().setReviewResult(currentReviewingFile, result);
                        get().completeReview(currentReviewingFile);
                    }
                },

                // WebSocket sync: Error
                syncError: (error: ReviewError) => {
                    const { currentReviewingFile, currentRequestId } = get();

                    if (
                        currentReviewingFile &&
                        currentRequestId === error.requestId
                    ) {
                        get().setReviewError(currentReviewingFile, error);
                        get().completeReview(currentReviewingFile);
                    }
                },
            }),
            {
                name: 'code-review-store',
            },
        ),
    ),
);

// Convenience hooks for specific file - returns individual properties to avoid object recreation
export const useFileReviewState = (filePath: string | undefined) => {
    const result = useCodeReviewStore((state) =>
        filePath ? state.reviews[filePath]?.result : undefined,
    );
    const progress = useCodeReviewStore((state) =>
        filePath ? state.reviews[filePath]?.progress : undefined,
    );
    const error = useCodeReviewStore((state) =>
        filePath ? state.reviews[filePath]?.error : undefined,
    );
    const isLoading = useCodeReviewStore((state) =>
        filePath ? (state.reviews[filePath]?.isLoading ?? false) : false,
    );

    return { result, progress, error, isLoading };
};

// Hook for actions only - extract individual action methods
export const useCodeReviewActions = () => {
    const setReviewResult = useCodeReviewStore(
        (state) => state.setReviewResult,
    );
    const setReviewProgress = useCodeReviewStore(
        (state) => state.setReviewProgress,
    );
    const setReviewError = useCodeReviewStore((state) => state.setReviewError);
    const clearReview = useCodeReviewStore((state) => state.clearReview);
    const clearProgress = useCodeReviewStore((state) => state.clearProgress);
    const clearAll = useCodeReviewStore((state) => state.clearAll);
    const startReview = useCodeReviewStore((state) => state.startReview);
    const completeReview = useCodeReviewStore((state) => state.completeReview);
    const cancelReview = useCodeReviewStore((state) => state.cancelReview);
    const syncProgress = useCodeReviewStore((state) => state.syncProgress);
    const syncResult = useCodeReviewStore((state) => state.syncResult);
    const syncError = useCodeReviewStore((state) => state.syncError);

    return {
        setReviewResult,
        setReviewProgress,
        setReviewError,
        clearReview,
        clearProgress,
        clearAll,
        startReview,
        completeReview,
        cancelReview,
        syncProgress,
        syncResult,
        syncError,
    };
};
