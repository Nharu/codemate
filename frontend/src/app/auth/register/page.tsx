'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useRegister } from '@/hooks/useRegister';

const registerSchema = z
    .object({
        email: z.string().email('유효한 이메일 주소를 입력해주세요'),
        username: z
            .string()
            .min(2, '사용자명은 최소 2자 이상이어야 합니다')
            .max(50, '사용자명은 최대 50자까지 가능합니다'),
        password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
        confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: '비밀번호와 비밀번호 확인이 일치하지 않습니다',
        path: ['confirmPassword'],
    });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [error, setError] = useState('');
    const registerMutation = useRegister();

    const form = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: '',
            username: '',
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = (data: RegisterForm) => {
        setError('');
        registerMutation.mutate({
            email: data.email,
            username: data.username,
            password: data.password,
        });
    };

    // 회원가입 성공 시 표시할 화면
    if (registerMutation.isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl text-green-600">
                            회원가입 완료!
                        </CardTitle>
                        <CardDescription>
                            계정이 성공적으로 생성되었습니다.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Link href="/auth/login" className="w-full">
                            <Button className="w-full">로그인하기</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">
                        CodeMate 회원가입
                    </CardTitle>
                    <CardDescription>
                        새 계정을 만들어 CodeMate를 시작하세요
                    </CardDescription>
                </CardHeader>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {(error || registerMutation.error) && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {error || registerMutation.error?.message}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">이메일</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                {...form.register('email')}
                                disabled={registerMutation.isPending}
                            />
                            {form.formState.errors.email && (
                                <p className="text-sm text-red-500">
                                    {form.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">사용자명</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="사용자명을 입력하세요"
                                {...form.register('username')}
                                disabled={registerMutation.isPending}
                            />
                            {form.formState.errors.username && (
                                <p className="text-sm text-red-500">
                                    {form.formState.errors.username.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">비밀번호</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="비밀번호를 입력하세요"
                                {...form.register('password')}
                                disabled={registerMutation.isPending}
                            />
                            {form.formState.errors.password && (
                                <p className="text-sm text-red-500">
                                    {form.formState.errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                비밀번호 확인
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="비밀번호를 다시 입력하세요"
                                {...form.register('confirmPassword')}
                                disabled={registerMutation.isPending}
                            />
                            {form.formState.errors.confirmPassword && (
                                <p className="text-sm text-red-500">
                                    {
                                        form.formState.errors.confirmPassword
                                            .message
                                    }
                                </p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 pt-6">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={registerMutation.isPending}
                        >
                            {registerMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            회원가입
                        </Button>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            이미 계정이 있으신가요?{' '}
                            <Link
                                href="/auth/login"
                                className="text-blue-600 hover:underline"
                            >
                                로그인
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
