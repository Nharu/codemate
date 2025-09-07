'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface ProfileForm {
    username: string;
    avatar_url: string;
}

export default function SettingsPage() {
    const { status } = useSession();
    const router = useRouter();
    const { data: profile, isLoading, error } = useProfile();
    const updateProfileMutation = useUpdateProfile();

    const [form, setForm] = useState<ProfileForm>({
        username: '',
        avatar_url: '',
    });
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (profile) {
            const newForm = {
                username: profile.username || '',
                avatar_url: profile.avatar_url || '',
            };
            setForm(newForm);
        }
    }, [profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
        setHasChanges(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!hasChanges) return;

        const updateData: Partial<ProfileForm> = {};

        if (form.username !== profile?.username) {
            updateData.username = form.username;
        }
        if (form.avatar_url !== profile?.avatar_url) {
            updateData.avatar_url = form.avatar_url;
        }

        if (Object.keys(updateData).length > 0) {
            updateProfileMutation.mutate(updateData, {
                onSuccess: () => {
                    setHasChanges(false);
                },
            });
        }
    };

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
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        대시보드로 돌아가기
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">프로필 설정</h1>
            </div>

            {/* Success/Error Messages */}
            {updateProfileMutation.isSuccess && (
                <Alert>
                    <AlertDescription>
                        프로필이 성공적으로 업데이트되었습니다.
                    </AlertDescription>
                </Alert>
            )}

            {updateProfileMutation.error && (
                <Alert variant="destructive">
                    <AlertDescription>
                        {updateProfileMutation.error.message}
                    </AlertDescription>
                </Alert>
            )}

            {/* Profile Settings Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        개인 정보
                    </CardTitle>
                    <CardDescription>프로필 정보를 수정하세요</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">이메일</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile?.email || ''}
                                disabled
                                className="bg-gray-100"
                            />
                            <p className="text-sm text-gray-500">
                                이메일은 변경할 수 없습니다
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">사용자명</Label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="사용자명을 입력하세요"
                                value={form.username}
                                onChange={handleChange}
                                disabled={updateProfileMutation.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="avatar_url">
                                프로필 이미지 URL
                            </Label>
                            <Input
                                id="avatar_url"
                                name="avatar_url"
                                type="url"
                                placeholder="https://example.com/avatar.jpg"
                                value={form.avatar_url}
                                onChange={handleChange}
                                disabled={updateProfileMutation.isPending}
                            />
                            <p className="text-sm text-gray-500">
                                프로필 이미지 URL을 입력하세요 (선택사항)
                            </p>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="submit"
                                disabled={
                                    !hasChanges ||
                                    updateProfileMutation.isPending
                                }
                            >
                                {updateProfileMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                <Save className="mr-2 h-4 w-4" />
                                저장
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
