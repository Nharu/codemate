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
        <header className="border-b bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link
                        href="/dashboard"
                        className="flex items-center space-x-2"
                    >
                        <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold text-lg">
                            CodeMate
                        </div>
                    </Link>

                    {/* Navigation - 로그인 시에만 표시 */}
                    {session && (
                        <nav className="hidden md:flex items-center space-x-6">
                            <Link
                                href="/dashboard/projects"
                                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                            >
                                프로젝트
                            </Link>
                            <Link
                                href="/collaborate"
                                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                            >
                                협업
                            </Link>
                        </nav>
                    )}

                    {/* Auth Section */}
                    <div className="flex items-center space-x-3">
                        {status === 'loading' ? (
                            <div className="animate-pulse">
                                <div className="h-10 w-20 bg-gray-200 rounded"></div>
                            </div>
                        ) : session ? (
                            <div className="flex items-center space-x-3">
                                {/* Profile Section */}
                                <div className="flex items-center space-x-2">
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
                                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                                        {profile?.username ||
                                            session.user?.name}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <Link href="/dashboard/settings">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-2"
                                    >
                                        <Settings size={16} />
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSignOut}
                                    className="p-2"
                                >
                                    <LogOut size={16} />
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
