import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { CodeReviewResult } from '@/components/ai/CodeReviewPanel';

export interface CodeReviewRequest {
    code: string;
    language: string;
    filePath?: string;
    context?: string;
}

export const useCodeReview = () => {
    const [result, setResult] = useState<CodeReviewResult | null>(null);

    const mutation = useMutation({
        mutationFn: async (
            request: CodeReviewRequest,
        ): Promise<CodeReviewResult> => {
            const response = await apiClient.post<CodeReviewResult>(
                '/ai/review',
                {
                    code: request.code,
                    language: request.language.toLowerCase(),
                    filePath: request.filePath,
                    context: request.context,
                },
            );
            return response.data;
        },
        onSuccess: (data) => {
            setResult(data);
        },
        onError: (error) => {
            console.error('코드 리뷰 실패:', error);
            setResult(null);
        },
    });

    const requestReview = (request: CodeReviewRequest) => {
        mutation.mutate(request);
    };

    const clearResult = () => {
        setResult(null);
        mutation.reset();
    };

    return {
        result,
        isLoading: mutation.isPending,
        error: mutation.error,
        requestReview,
        clearResult,
    };
};
