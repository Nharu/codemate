import { useState, useCallback } from 'react';
import { usePyodide } from './usePyodide';
import type { ExecutionResult } from '@/types/execution';

export function useCodeExecution() {
    const {
        executeCode,
        loading: pyodideLoading,
        error: pyodideError,
    } = usePyodide();
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] =
        useState<ExecutionResult | null>(null);

    const runCode = useCallback(
        async (code: string) => {
            if (pyodideLoading) {
                throw new Error(
                    'Pyodide가 아직 로딩 중입니다. 잠시 후 다시 시도해주세요.',
                );
            }

            if (pyodideError) {
                throw new Error(`Pyodide 로딩 실패: ${pyodideError}`);
            }

            setIsExecuting(true);
            setExecutionResult(null);

            try {
                const result = await executeCode(code);
                setExecutionResult(result);
                return result;
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : '알 수 없는 오류가 발생했습니다.';
                const errorResult: ExecutionResult = {
                    output: '',
                    error: errorMessage,
                    executionTime: 0,
                };
                setExecutionResult(errorResult);
                throw error;
            } finally {
                setIsExecuting(false);
            }
        },
        [executeCode, pyodideLoading, pyodideError],
    );

    const clearResult = useCallback(() => {
        setExecutionResult(null);
    }, []);

    return {
        runCode,
        clearResult,
        isExecuting,
        executionResult,
        pyodideLoading,
        pyodideError,
    };
}
