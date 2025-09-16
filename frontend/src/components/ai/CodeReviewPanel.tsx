'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Info,
    XCircle,
    Loader2,
    Sparkles,
    Bug,
    Shield,
    Zap,
    Paintbrush,
    Settings,
    BookOpen,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ReviewIssue {
    line: number;
    column?: number;
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
    category:
        | 'bug'
        | 'security'
        | 'performance'
        | 'style'
        | 'maintainability'
        | 'best_practices';
    title: string;
    description: string;
    suggestion?: string;
    suggestedCode?: string;
}

export interface CodeReviewResult {
    overallScore: number;
    summary: string;
    issues: ReviewIssue[];
    suggestions: string[];
    strengths: string[];
    reviewTime: number;
}

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

interface CodeReviewPanelProps {
    isOpen: boolean;
    onClose: () => void;
    result: CodeReviewResult | null;
    isLoading: boolean;
    onRequestReview: () => void;
    currentProgress?: ReviewProgress | null;
    error?: ReviewError | null;
    onCancel?: () => void;
}

const SeverityIcon = ({ severity }: { severity: ReviewIssue['severity'] }) => {
    switch (severity) {
        case 'critical':
            return <XCircle className="h-4 w-4 text-red-600" />;
        case 'high':
            return <AlertCircle className="h-4 w-4 text-red-500" />;
        case 'medium':
            return <AlertTriangle className="h-4 w-4 text-orange-500" />;
        case 'low':
            return <Info className="h-4 w-4 text-yellow-500" />;
        case 'info':
            return <Info className="h-4 w-4 text-blue-500" />;
    }
};

const CategoryIcon = ({ category }: { category: ReviewIssue['category'] }) => {
    switch (category) {
        case 'bug':
            return <Bug className="h-4 w-4 text-red-500" />;
        case 'security':
            return <Shield className="h-4 w-4 text-purple-500" />;
        case 'performance':
            return <Zap className="h-4 w-4 text-yellow-500" />;
        case 'style':
            return <Paintbrush className="h-4 w-4 text-blue-500" />;
        case 'maintainability':
            return <Settings className="h-4 w-4 text-gray-500" />;
        case 'best_practices':
            return <BookOpen className="h-4 w-4 text-green-500" />;
    }
};

const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
};

const getSeverityColor = (severity: ReviewIssue['severity']) => {
    switch (severity) {
        case 'critical':
            return 'border-red-600 bg-red-50';
        case 'high':
            return 'border-red-500 bg-red-50';
        case 'medium':
            return 'border-orange-500 bg-orange-50';
        case 'low':
            return 'border-yellow-500 bg-yellow-50';
        case 'info':
            return 'border-blue-500 bg-blue-50';
    }
};

export default function CodeReviewPanel({
    isOpen,
    onClose,
    result,
    isLoading,
    onRequestReview,
    currentProgress,
    error,
    onCancel,
}: CodeReviewPanelProps) {
    const [selectedIssue, setSelectedIssue] = useState<ReviewIssue | null>(
        null,
    );
    const [panelWidth, setPanelWidth] = useState(384); // 384px = w-96
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback(
        (e: MouseEvent) => {
            if (isResizing) {
                const newWidth = window.innerWidth - e.clientX;
                // 최소 300px, 최대 800px로 제한
                const clampedWidth = Math.max(300, Math.min(800, newWidth));
                setPanelWidth(clampedWidth);
            }
        },
        [isResizing],
    );

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, resize, stopResizing]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-y-0 right-0 bg-white border-l shadow-lg z-50 flex flex-col relative"
            style={{ width: panelWidth }}
        >
            {/* Resize Handle */}
            <div
                className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-blue-500 hover:bg-opacity-80 transition-colors group z-20 bg-transparent"
                onMouseDown={startResizing}
            />

            {/* Header */}
            <div className="h-14 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-between px-4">
                <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <h2 className="font-semibold text-lg">AI 코드 리뷰</h2>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                    ×
                </Button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                {error ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <XCircle className="h-12 w-12 text-red-500 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            AI 리뷰 오류
                        </h3>
                        <p className="text-sm text-gray-600 mb-6 max-w-sm">
                            {error.message}
                        </p>
                        <Button
                            onClick={onRequestReview}
                            className="bg-gradient-to-r from-blue-600 to-purple-600"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            다시 시도하기
                        </Button>
                    </div>
                ) : isLoading || currentProgress ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-sm mx-auto">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                            <p className="text-sm text-gray-900 font-medium mb-2">
                                {currentProgress?.message ||
                                    'AI가 코드를 분석하고 있습니다...'}
                            </p>
                            {currentProgress && (
                                <>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                        <div
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${currentProgress.progress}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4">
                                        {currentProgress.progress}% 완료
                                    </p>
                                    {onCancel && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={onCancel}
                                            className="text-gray-600"
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            취소
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ) : result ? (
                    <>
                        <ScrollArea className="flex-1 h-0">
                            <div className="p-4 space-y-4">
                                {/* Overall Score */}
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center">
                                            <div
                                                className={`text-3xl font-bold ${getScoreColor(result.overallScore)}`}
                                            >
                                                {result.overallScore}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                코드 품질 점수
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2">
                                                리뷰 시간: {result.reviewTime}ms
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Summary */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">
                                            요약
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-700">
                                            {result.summary}
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Issues */}
                                {result.issues.length > 0 && (
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm flex items-center">
                                                <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                                                이슈 ({result.issues.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {result.issues.map(
                                                    (issue, index) => (
                                                        <div
                                                            key={index}
                                                            className={`p-3 border-l-4 rounded-r cursor-pointer transition-colors ${getSeverityColor(issue.severity)} ${
                                                                selectedIssue ===
                                                                issue
                                                                    ? 'bg-opacity-100'
                                                                    : 'bg-opacity-50 hover:bg-opacity-75'
                                                            }`}
                                                            onClick={() =>
                                                                setSelectedIssue(
                                                                    selectedIssue ===
                                                                        issue
                                                                        ? null
                                                                        : issue,
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-start space-x-2">
                                                                <div className="flex items-center space-x-1 mt-0.5">
                                                                    <SeverityIcon
                                                                        severity={
                                                                            issue.severity
                                                                        }
                                                                    />
                                                                    <CategoryIcon
                                                                        category={
                                                                            issue.category
                                                                        }
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center space-x-2 mb-1">
                                                                        <span className="text-xs font-medium text-gray-600">
                                                                            라인{' '}
                                                                            {
                                                                                issue.line
                                                                            }
                                                                            {issue.column &&
                                                                                `:${issue.column}`}
                                                                        </span>
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="text-xs"
                                                                        >
                                                                            {
                                                                                issue.severity
                                                                            }
                                                                        </Badge>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            {
                                                                                issue.category
                                                                            }
                                                                        </Badge>
                                                                    </div>
                                                                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                                                                        {
                                                                            issue.title
                                                                        }
                                                                    </h4>
                                                                    <p className="text-xs text-gray-700">
                                                                        {
                                                                            issue.description
                                                                        }
                                                                    </p>

                                                                    {selectedIssue ===
                                                                        issue && (
                                                                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                                                            {issue.suggestion && (
                                                                                <div>
                                                                                    <h5 className="text-xs font-medium text-gray-900 mb-1">
                                                                                        💡
                                                                                        제안사항:
                                                                                    </h5>
                                                                                    <p className="text-xs text-gray-700">
                                                                                        {
                                                                                            issue.suggestion
                                                                                        }
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                            {issue.suggestedCode && (
                                                                                <div>
                                                                                    <h5 className="text-xs font-medium text-gray-900 mb-1">
                                                                                        🔧
                                                                                        수정
                                                                                        코드:
                                                                                    </h5>
                                                                                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap break-words">
                                                                                        <code className="break-words">
                                                                                            {
                                                                                                issue.suggestedCode
                                                                                            }
                                                                                        </code>
                                                                                    </pre>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Suggestions */}
                                {result.suggestions.length > 0 && (
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm flex items-center">
                                                <Info className="h-4 w-4 mr-2 text-blue-500" />
                                                개선 제안
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {result.suggestions.map(
                                                    (suggestion, index) => (
                                                        <li
                                                            key={index}
                                                            className="text-sm text-gray-700 flex items-start"
                                                        >
                                                            <span className="text-blue-500 mr-2 mt-1">
                                                                •
                                                            </span>
                                                            {suggestion}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Strengths */}
                                {result.strengths.length > 0 && (
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm flex items-center">
                                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                                                장점
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {result.strengths.map(
                                                    (strength, index) => (
                                                        <li
                                                            key={index}
                                                            className="text-sm text-gray-700 flex items-start"
                                                        >
                                                            <span className="text-green-500 mr-2 mt-1">
                                                                ✓
                                                            </span>
                                                            {strength}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Re-review Button */}
                        <div className="border-t bg-white p-4">
                            <Button
                                onClick={onRequestReview}
                                variant="outline"
                                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                재리뷰
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <Sparkles className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            AI 코드 리뷰
                        </h3>
                        <p className="text-sm text-gray-600 mb-6 max-w-sm">
                            현재 열린 파일의 코드를 AI가 분석하여 버그, 보안
                            이슈, 성능 문제, 개선점을 찾아드립니다.
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={onRequestReview}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 w-full"
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                리뷰 시작하기
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
