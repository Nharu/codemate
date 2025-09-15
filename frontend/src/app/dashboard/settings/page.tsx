'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { toast } from 'sonner';
import {
    useProfile,
    useUpdateProfile,
    useUploadAvatar,
} from '@/hooks/useProfile';
import { useChangePassword } from '@/hooks/useChangePassword';
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
import { Loader2, User, ArrowLeft, Save, Upload, X, Lock } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';

const profileSchema = z.object({
    username: z
        .string()
        .min(2, '사용자명은 최소 2자 이상이어야 합니다')
        .max(50, '사용자명은 최대 50자까지 가능합니다'),
});

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
        newPassword: z
            .string()
            .min(6, '새 비밀번호는 최소 6자 이상이어야 합니다'),
        confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다',
        path: ['confirmPassword'],
    });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
    const { status } = useSession();
    const router = useRouter();
    const { data: profile, isLoading, error } = useProfile();
    const updateProfileMutation = useUpdateProfile();
    const uploadAvatarMutation = useUploadAvatar();
    const changePasswordMutation = useChangePassword();

    const profileForm = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: '',
        },
    });

    const passwordForm = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (profile) {
            profileForm.reset({
                username: profile.username || '',
            });
            setPreviewUrl(profile.avatar_url || '');
        }
    }, [profile, profileForm]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('이미지 파일만 선택할 수 있습니다.');
                return;
            }

            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('파일 크기는 5MB 이하여야 합니다.');
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
                // Avatar URL is managed separately from the form
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

    const onProfileSubmit = (data: ProfileForm) => {
        const updateData: Partial<ProfileForm> = {};

        if (data.username !== profile?.username) {
            updateData.username = data.username;
        }

        if (Object.keys(updateData).length > 0) {
            updateProfileMutation.mutate(updateData);
        }
    };

    const onPasswordSubmit = (data: PasswordForm) => {
        changePasswordMutation.mutate(
            {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            },
            {
                onSuccess: () => {
                    passwordForm.reset();
                },
            },
        );
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
        <div className="min-h-screen bg-gray-50">
            <Header />
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
                        <CardDescription>
                            프로필 정보를 수정하세요
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                            className="space-y-4"
                        >
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
                                    type="text"
                                    placeholder="사용자명을 입력하세요"
                                    {...profileForm.register('username')}
                                    disabled={updateProfileMutation.isPending}
                                />
                                {profileForm.formState.errors.username && (
                                    <p className="text-sm text-red-500">
                                        {
                                            profileForm.formState.errors
                                                .username.message
                                        }
                                    </p>
                                )}
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
                                                        .getElementById(
                                                            'avatar',
                                                        )
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
                                                        onClick={
                                                            handleFileUpload
                                                        }
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
                                                        onClick={
                                                            handleRemoveFile
                                                        }
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
                                        !profileForm.formState.isDirty ||
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

                {/* Password Change Card - Only show for non-OAuth users */}
                {profile && 'hasPassword' in profile && profile.hasPassword && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Lock className="h-5 w-5 mr-2" />
                                비밀번호 변경
                            </CardTitle>
                            <CardDescription>
                                계정 보안을 위해 정기적으로 비밀번호를
                                변경하세요
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Password Change Success Message */}
                            {changePasswordMutation.isSuccess && (
                                <Alert className="mb-4">
                                    <AlertDescription>
                                        비밀번호가 성공적으로 변경되었습니다.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Password Change Error Message */}
                            {changePasswordMutation.error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertDescription>
                                        {changePasswordMutation.error.message}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <form
                                onSubmit={passwordForm.handleSubmit(
                                    onPasswordSubmit,
                                )}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">
                                        현재 비밀번호
                                    </Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        placeholder="현재 비밀번호를 입력하세요"
                                        {...passwordForm.register(
                                            'currentPassword',
                                        )}
                                        disabled={
                                            changePasswordMutation.isPending
                                        }
                                    />
                                    {passwordForm.formState.errors
                                        .currentPassword && (
                                        <p className="text-sm text-red-500">
                                            {
                                                passwordForm.formState.errors
                                                    .currentPassword.message
                                            }
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">
                                        새 비밀번호
                                    </Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        placeholder="새 비밀번호를 입력하세요"
                                        {...passwordForm.register(
                                            'newPassword',
                                        )}
                                        disabled={
                                            changePasswordMutation.isPending
                                        }
                                    />
                                    {passwordForm.formState.errors
                                        .newPassword && (
                                        <p className="text-sm text-red-500">
                                            {
                                                passwordForm.formState.errors
                                                    .newPassword.message
                                            }
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">
                                        새 비밀번호 확인
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="새 비밀번호를 다시 입력하세요"
                                        {...passwordForm.register(
                                            'confirmPassword',
                                        )}
                                        disabled={
                                            changePasswordMutation.isPending
                                        }
                                    />
                                    {passwordForm.formState.errors
                                        .confirmPassword && (
                                        <p className="text-sm text-red-500">
                                            {
                                                passwordForm.formState.errors
                                                    .confirmPassword.message
                                            }
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => passwordForm.reset()}
                                        disabled={
                                            changePasswordMutation.isPending
                                        }
                                    >
                                        취소
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            !passwordForm.formState.isValid ||
                                            changePasswordMutation.isPending
                                        }
                                    >
                                        {changePasswordMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        <Lock className="mr-2 h-4 w-4" />
                                        비밀번호 변경
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
