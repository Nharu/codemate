import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';

const authOptions: NextAuthOptions = {
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                email: credentials.email,
                                password: credentials.password,
                            }),
                        },
                    );

                    if (!response.ok) {
                        return null;
                    }

                    const data = await response.json();

                    return {
                        id: data.user.id,
                        email: data.user.email,
                        username: data.user.username,
                        name: data.user.username,
                        image: data.user.avatar_url,
                        avatar_url: data.user.avatar_url,
                        hasPassword: data.user.password !== null,
                        accessToken: data.access_token,
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // OAuth 로그인의 경우 백엔드에 사용자 생성/조회
            if (
                account?.provider === 'github' ||
                account?.provider === 'google'
            ) {
                try {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                provider: account.provider,
                                providerId: user.id,
                                email: user.email,
                                username:
                                    user.name || user.email?.split('@')[0],
                                avatar_url: user.image,
                            }),
                        },
                    );

                    if (!response.ok) {
                        console.error('Failed to create/find OAuth user');
                        return false;
                    }

                    const data = await response.json();
                    // 백엔드에서 받은 사용자 정보로 user 객체 업데이트
                    user.id = data.user.id;
                    user.email = data.user.email;
                    user.username = data.user.username;
                    user.name = data.user.username;
                    user.image = data.user.avatar_url;
                    user.avatar_url = data.user.avatar_url;
                    user.hasPassword = data.user.password !== null;
                    user.accessToken = data.access_token;
                } catch (error) {
                    console.error('OAuth signIn error:', error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = user.accessToken;
                token.id = user.id;
                token.username = user.username;
                token.avatar_url = user.avatar_url;
                token.hasPassword = user.hasPassword;
            }
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            if (token.id) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.avatar_url = token.avatar_url as string;
                session.user.hasPassword = token.hasPassword as boolean;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
