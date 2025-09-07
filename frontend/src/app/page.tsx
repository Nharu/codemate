'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import Header from '@/components/layout/Header';
import {
    Users,
    Bot,
    GitBranch,
    MessageSquare,
    Zap,
    Shield,
} from 'lucide-react';

export default function HomePage() {
    const { data: session } = useSession();

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Hero Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
                <div className="max-w-7xl mx-auto text-center text-white">
                    <h1 className="text-5xl font-bold mb-6">
                        AI와 함께하는
                        <br />
                        <span className="text-yellow-300">
                            스마트 코드 협업
                        </span>
                    </h1>
                    <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
                        Claude Sonnet 4 기반 AI 코드 리뷰와 실시간 협업 기능으로
                        <br />더 빠르고 안전한 개발 환경을 경험하세요
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {session ? (
                            <Link href="/dashboard">
                                <Button size="lg" className="text-lg px-8 py-3">
                                    대시보드로 이동
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/auth/register">
                                    <Button
                                        size="lg"
                                        className="text-lg px-8 py-3"
                                    >
                                        무료로 시작하기
                                    </Button>
                                </Link>
                                <Link href="/auth/login">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="text-lg px-8 py-3 bg-white/10 border-white/30 text-white hover:bg-white/20"
                                    >
                                        로그인
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            강력한 기능들
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            AI 기술과 실시간 협업 기능으로 개발 생산성을
                            극대화하세요
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Card className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <Bot className="w-12 h-12 text-blue-600 mb-2" />
                                <CardTitle>AI 코드 리뷰</CardTitle>
                                <CardDescription>
                                    Claude Sonnet 4를 활용한 실시간 코드 분석 및
                                    개선 제안
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li>
                                        • 1M 토큰 컨텍스트로 전체 코드베이스
                                        분석
                                    </li>
                                    <li>
                                        • 72.7% SWE-bench 성능으로 정확한 리뷰
                                    </li>
                                    <li>• 보안 취약점 및 버그 자동 탐지</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <Users className="w-12 h-12 text-green-600 mb-2" />
                                <CardTitle>실시간 협업</CardTitle>
                                <CardDescription>
                                    여러 개발자가 동시에 코드를 편집하고 협업할
                                    수 있는 환경
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li>• Monaco Editor 기반 실시간 편집</li>
                                    <li>• 커서 및 선택 영역 실시간 동기화</li>
                                    <li>• 충돌 방지 및 자동 해결</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <MessageSquare className="w-12 h-12 text-purple-600 mb-2" />
                                <CardTitle>통합 커뮤니케이션</CardTitle>
                                <CardDescription>
                                    코드 리뷰와 협업을 위한 실시간 채팅 및 댓글
                                    시스템
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li>• 코드 라인별 댓글 및 토론</li>
                                    <li>• 실시간 채팅 및 알림</li>
                                    <li>• 리뷰 결과 시각화 대시보드</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <GitBranch className="w-12 h-12 text-orange-600 mb-2" />
                                <CardTitle>Git 통합</CardTitle>
                                <CardDescription>
                                    GitHub, GitLab과 완벽하게 연동되는 버전 관리
                                    시스템
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li>• GitHub/GitLab 자동 연동</li>
                                    <li>• 브랜치별 코드 리뷰 관리</li>
                                    <li>• Pull Request 통합 워크플로우</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <Shield className="w-12 h-12 text-red-600 mb-2" />
                                <CardTitle>보안 & 품질</CardTitle>
                                <CardDescription>
                                    ESLint, SonarQube 통합으로 코드 품질과 보안
                                    보장
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li>• 자동 보안 취약점 스캔</li>
                                    <li>• 코드 품질 메트릭 분석</li>
                                    <li>• 베스트 프랙티스 제안</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="group hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <Zap className="w-12 h-12 text-yellow-600 mb-2" />
                                <CardTitle>성능 최적화</CardTitle>
                                <CardDescription>
                                    AI 기반 코드 최적화 제안으로 성능 향상
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li>• 성능 병목 지점 자동 탐지</li>
                                    <li>• 최적화 방안 AI 제안</li>
                                    <li>• 리팩토링 가이드라인</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gray-900 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        지금 바로 시작해보세요
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        무료 계정으로 CodeMate의 모든 기능을 체험해보세요
                    </p>
                    {!session && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/auth/register">
                                <Button size="lg" className="text-lg px-8 py-3">
                                    무료로 시작하기
                                </Button>
                            </Link>
                            <Link href="/demo">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-gray-900"
                                >
                                    데모 보기
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-100 py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <div className="mb-8">
                            <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold inline-block">
                                CodeMate
                            </div>
                        </div>
                        <p className="text-gray-600 mb-4">
                            AI를 활용한 차세대 코드 협업 플랫폼
                        </p>
                        <p className="text-sm text-gray-500">
                            © 2025 CodeMate. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
