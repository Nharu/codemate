export interface ExecutionResult {
    output: string;
    error: string | null;
    executionTime: number;
    images?: string[]; // Base64 인코딩된 이미지 (matplotlib 등)
}

export interface ExecutionState {
    isExecuting: boolean;
    result: ExecutionResult | null;
}
