import { useMutation } from '@tanstack/react-query';

interface RegisterData {
    email: string;
    username: string;
    ***REMOVED***: string;
}

interface RegisterResponse {
    id: string;
    email: string;
    username: string;
    created_at: string;
}

const registerUser = async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        },
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '회원가입에 실패했습니다.');
    }

    return response.json();
};

export function useRegister() {
    return useMutation({
        mutationFn: registerUser,
        onSuccess: (data) => {
            console.log('Registration successful:', data);
        },
        onError: (error) => {
            console.error('Registration failed:', error);
        },
    });
}
