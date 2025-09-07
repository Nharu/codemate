'use client';

import { useState } from 'react';
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

interface RegisterForm {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
}

export default function RegisterPage() {
    const [form, setForm] = useState<RegisterForm>({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');

    const registerMutation = useRegister();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
        if (error) setError('');
    };

    const validateForm = () => {
        if (
            !form.email ||
            !form.username ||
            !form.password ||
            !form.confirmPassword
        ) {
            setError('모든 필드를 입력해주세요.');
            return false;
        }

        if (form.password !== form.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return false;
        }

        if (form.password.length < 6) {
            setError('비밀번호는 6자리 이상이어야 합니다.');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            setError('유효한 이메일 주소를 입력해주세요.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        registerMutation.mutate({
            email: form.email,
            username: form.username,
            password: form.password,
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
                <form onSubmit={handleSubmit}>
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
                                name="email"
                                type="email"
                                placeholder="your@email.com"
                                value={form.email}
                                onChange={handleChange}
                                disabled={registerMutation.isPending}
                            />
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
                                disabled={registerMutation.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">비밀번호</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="비밀번호를 입력하세요"
                                value={form.password}
                                onChange={handleChange}
                                disabled={registerMutation.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                비밀번호 확인
                            </Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="비밀번호를 다시 입력하세요"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                disabled={registerMutation.isPending}
                            />
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
