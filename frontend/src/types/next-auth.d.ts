import 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            username: string;
            avatar_url?: string;
            hasPassword: boolean;
        };
        accessToken?: string;
    }

    interface User {
        id: string;
        email: string;
        username: string;
        avatar_url?: string;
        hasPassword: boolean; // OAuth 사용자인지 여부를 나타내는 안전한 방법
        accessToken?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string;
    }
}
