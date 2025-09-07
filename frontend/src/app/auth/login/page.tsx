'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
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

interface LoginForm {
    email: string;
    ***REMOVED***: string;
}

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState<LoginForm>({
        email: '',
        ***REMOVED***: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
        if (error) setError('');
    };

    const validateForm = () => {
        if (!form.email || !form.***REMOVED***) {
            setError('이메일과 비밀번호를 입력해주세요.');
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

        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email: form.email,
                ***REMOVED***: form.***REMOVED***,
                redirect: false,
            });

            if (result?.error) {
                setError(
                    '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.',
                );
                return;
            }

            // 로그인 성공 시 세션 확인 후 리다이렉트
            const session = await getSession();
            if (session) {
                router.push('/');
            }
        } catch {
            setError('로그인 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">CodeMate 로그인</CardTitle>
                    <CardDescription>
                        계정에 로그인하여 CodeMate를 사용하세요
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
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
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="***REMOVED***">비밀번호</Label>
                            <Input
                                id="***REMOVED***"
                                name="***REMOVED***"
                                type="***REMOVED***"
                                placeholder="비밀번호를 입력하세요"
                                value={form.***REMOVED***}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 pt-6">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            로그인
                        </Button>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            계정이 없으신가요?{' '}
                            <Link
                                href="/auth/register"
                                className="text-blue-600 hover:underline"
                            >
                                회원가입
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
