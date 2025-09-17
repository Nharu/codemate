'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { useProfile } from '@/hooks/useProfile';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Loader2,
    User,
    Calendar,
    Mail,
    Settings,
    Plus,
    Folder,
    Eye,
    Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Header from '@/components/layout/Header';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { data: profile, isLoading, error } = useProfile();
    const { data: projects } = useProjects();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login');
        }
    }, [status, router]);

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertDescription>
                        프로필을 불러오는 중 오류가 발생했습니다.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto p-6 space-y-6">
                {/* Welcome Section */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">
                            안녕하세요,{' '}
                            {profile?.username || session?.user?.username}
                            님!
                        </h1>
                        <p className="text-gray-600 mt-1">
                            CodeMate 대시보드에서 프로젝트를 관리하고
                            협업하세요.
                        </p>
                    </div>
                    <Link href="/dashboard/settings">
                        <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            설정
                        </Button>
                    </Link>
                </div>

                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            프로필 정보
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4 mb-4">
                            {/* Profile Avatar */}
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                                {profile?.avatar_url ? (
                                    <Image
                                        src={profile.avatar_url}
                                        alt="Profile"
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-6 h-6 text-gray-400" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">
                                    {profile?.username}
                                </h3>
                                <p className="text-gray-600">
                                    {profile?.email}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span>{profile?.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span>{profile?.username}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span>
                                    가입일:{' '}
                                    {profile?.created_at
                                        ? new Date(
                                              profile.created_at,
                                          ).toLocaleDateString('ko-KR')
                                        : '-'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push('/dashboard/projects')}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Plus className="h-5 w-5 mr-2" />새 프로젝트
                            </CardTitle>
                            <CardDescription>
                                새로운 코드 프로젝트를 시작하세요
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full">프로젝트 생성</Button>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push('/dashboard/projects')}
                    >
                        <CardHeader>
                            <CardTitle>프로젝트 관리</CardTitle>
                            <CardDescription>
                                내 프로젝트를 관리하고 협업하세요
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold">
                                    {projects?.length || 0}
                                </span>
                                <span className="text-sm text-gray-500">
                                    개의 프로젝트
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle>AI 코드 리뷰</CardTitle>
                            <CardDescription>
                                AI를 활용한 코드 분석 및 리뷰
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="outline"
                                className="w-full"
                                disabled
                            >
                                곧 출시 예정
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Projects */}
                {projects && projects.length > 0 && (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center">
                                    <Folder className="h-5 w-5 mr-2" />
                                    최근 프로젝트
                                </CardTitle>
                                <Link href="/dashboard/projects">
                                    <Button variant="outline" size="sm">
                                        모든 프로젝트 보기
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {projects.slice(0, 3).map((project) => (
                                    <div
                                        key={project.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/projects/${project.id}`,
                                            )
                                        }
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Folder className="h-5 w-5 text-blue-500" />
                                            <div>
                                                <h4 className="font-medium">
                                                    {project.name}
                                                </h4>
                                                <p className="text-sm text-gray-500 truncate max-w-[300px]">
                                                    {project.description ||
                                                        '설명이 없습니다.'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge
                                                variant={
                                                    project.visibility ===
                                                    'public'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {project.visibility ===
                                                'public' ? (
                                                    <>
                                                        <Eye className="mr-1 h-3 w-3" />
                                                        공개
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="mr-1 h-3 w-3" />
                                                        비공개
                                                    </>
                                                )}
                                            </Badge>
                                            <span className="text-xs text-gray-500">
                                                {new Date(
                                                    project.updated_at,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
