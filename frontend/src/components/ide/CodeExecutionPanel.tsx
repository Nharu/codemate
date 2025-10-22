'use client';

import {
    X,
    Terminal,
    AlertCircle,
    Clock,
    Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { ExecutionResult } from '@/types/execution';

interface CodeExecutionPanelProps {
    result: ExecutionResult | null;
    isExecuting: boolean;
    onClose: () => void;
}

export default function CodeExecutionPanel({
    result,
    isExecuting,
    onClose,
}: CodeExecutionPanelProps) {
    return (
        <div className="h-full flex flex-col bg-gray-900 border-l border-gray-700">
            {/* 헤더 */}
            <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-gray-200">
                        실행 결과
                    </span>
                    {isExecuting && (
                        <Badge
                            variant="outline"
                            className="bg-blue-500/10 text-blue-400 border-blue-500/50"
                        >
                            실행 중...
                        </Badge>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* 내용 */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {isExecuting && (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex items-center space-x-3 text-blue-400">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent" />
                                <span>코드 실행 중...</span>
                            </div>
                        </div>
                    )}

                    {!isExecuting && !result && (
                        <div className="flex items-center justify-center py-8 text-gray-500">
                            <div className="text-center">
                                <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>실행 버튼을 클릭하여 코드를 실행하세요</p>
                            </div>
                        </div>
                    )}

                    {!isExecuting && result && (
                        <>
                            {/* 실행 시간 */}
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>
                                    실행 시간: {result.executionTime.toFixed(2)}
                                    ms
                                </span>
                            </div>

                            {/* 에러 메시지 */}
                            {result.error && (
                                <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3">
                                    <div className="flex items-start space-x-2">
                                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-red-400 mb-1">
                                                에러 발생
                                            </p>
                                            <pre className="text-xs text-red-300 whitespace-pre-wrap break-words font-mono overflow-x-auto">
                                                {result.error}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 출력 */}
                            {result.output && (
                                <div className="bg-gray-800 border border-gray-700 rounded-md p-3">
                                    <p className="text-xs text-gray-400 mb-2 font-medium">
                                        출력:
                                    </p>
                                    <pre className="text-sm text-gray-200 whitespace-pre-wrap break-words font-mono overflow-x-auto">
                                        {result.output}
                                    </pre>
                                </div>
                            )}

                            {/* 이미지 출력 (matplotlib 등) */}
                            {result.images && result.images.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                                        <ImageIcon className="w-3 h-3" />
                                        <span>
                                            생성된 이미지 (
                                            {result.images.length}개)
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {result.images.map((img, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-gray-800 border border-gray-700 rounded-md p-3"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={`data:image/png;base64,${img}`}
                                                    alt={`Plot ${idx + 1}`}
                                                    className="w-full rounded"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 결과 없음 */}
                            {!result.error &&
                                !result.output &&
                                !result.images && (
                                    <div className="text-center py-4 text-gray-500 text-sm">
                                        출력 결과가 없습니다
                                    </div>
                                )}
                        </>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
