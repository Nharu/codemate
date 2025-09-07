'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { User, LogOut, Settings } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

export default function Header() {
    const { data: session, status } = useSession();
    const { data: profile } = useProfile();

    const handleSignOut = () => {
        signOut({ callbackUrl: '/' });
    };

    return (
        <header className="border-b bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold">
                            CodeMate
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link
                            href="/features"
                            className="text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            기능
                        </Link>
                        <Link
                            href="/pricing"
                            className="text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            요금
                        </Link>
                        <Link
                            href="/docs"
                            className="text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            문서
                        </Link>
                    </nav>

                    {/* Auth Section */}
                    <div className="flex items-center space-x-4">
                        {status === 'loading' ? (
                            <div className="animate-pulse">
                                <div className="h-10 w-20 bg-gray-200 rounded"></div>
                            </div>
                        ) : session ? (
                            <div className="flex items-center space-x-3">
                                <Link href="/dashboard">
                                    <Button variant="ghost" size="sm">
                                        대시보드
                                    </Button>
                                </Link>
                                <div className="flex items-center space-x-2">
                                    {/* Profile Image or User Icon */}
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center">
                                        {profile?.avatar_url ? (
                                            <Image
                                                src={profile.avatar_url}
                                                alt="Profile"
                                                width={32}
                                                height={32}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User
                                                size={16}
                                                className="text-gray-500"
                                            />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">
                                        {profile?.username ||
                                            session.user?.name}
                                    </span>
                                </div>

                                {/* Settings Button */}
                                <Link href="/dashboard/settings">
                                    <Button variant="ghost" size="sm">
                                        <Settings size={16} />
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSignOut}
                                    className="flex items-center space-x-1"
                                >
                                    <LogOut size={16} />
                                    <span>로그아웃</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link href="/auth/login">
                                    <Button variant="ghost">로그인</Button>
                                </Link>
                                <Link href="/auth/register">
                                    <Button>회원가입</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
