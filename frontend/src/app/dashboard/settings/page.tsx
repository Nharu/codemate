'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
    useProfile,
    useUpdateProfile,
    useUploadAvatar,
} from '@/hooks/useProfile';
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
import { Loader2, User, ArrowLeft, Save, Upload, X } from 'lucide-react';
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
    const uploadAvatarMutation = useUploadAvatar();

    const [form, setForm] = useState<ProfileForm>({
        username: '',
        avatar_url: '',
    });
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

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
            setPreviewUrl(profile.avatar_url || '');
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 선택할 수 있습니다.');
                return;
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert('파일 크기는 5MB 이하여야 합니다.');
                return;
            }

            setSelectedFile(file);

            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return;

        uploadAvatarMutation.mutate(selectedFile, {
            onSuccess: (updatedUser) => {
                setSelectedFile(null);
                setPreviewUrl(updatedUser.avatar_url || '');
                setForm((prev) => ({
                    ...prev,
                    avatar_url: updatedUser.avatar_url || '',
                }));
                // Clean up the blob URL
                if (previewUrl && previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(previewUrl);
                }
            },
        });
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(profile?.avatar_url || '');
        // Clean up the blob URL
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
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
            {(updateProfileMutation.isSuccess ||
                uploadAvatarMutation.isSuccess) && (
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

            {uploadAvatarMutation.error && (
                <Alert variant="destructive">
                    <AlertDescription>
                        아바타 업로드에 실패했습니다:{' '}
                        {uploadAvatarMutation.error.message}
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

                        <div className="space-y-4">
                            <Label htmlFor="avatar">프로필 이미지</Label>

                            {/* Avatar Preview */}
                            <div className="flex items-start space-x-4">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                                    {previewUrl ? (
                                        <Image
                                            src={previewUrl}
                                            alt="Profile preview"
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>

                                <div className="flex-1 space-y-2">
                                    {/* File Input */}
                                    <div className="flex items-center space-x-2">
                                        <input
                                            id="avatar"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            disabled={
                                                uploadAvatarMutation.isPending
                                            }
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                document
                                                    .getElementById('avatar')
                                                    ?.click()
                                            }
                                            disabled={
                                                uploadAvatarMutation.isPending
                                            }
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            이미지 선택
                                        </Button>

                                        {selectedFile && (
                                            <>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleFileUpload}
                                                    disabled={
                                                        uploadAvatarMutation.isPending
                                                    }
                                                >
                                                    {uploadAvatarMutation.isPending && (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    )}
                                                    업로드
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleRemoveFile}
                                                    disabled={
                                                        uploadAvatarMutation.isPending
                                                    }
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>

                                    {selectedFile && (
                                        <p className="text-sm text-gray-600">
                                            선택된 파일: {selectedFile.name}
                                        </p>
                                    )}

                                    <p className="text-sm text-gray-500">
                                        JPG, PNG 파일만 가능합니다. 최대 5MB
                                    </p>
                                </div>
                            </div>
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
