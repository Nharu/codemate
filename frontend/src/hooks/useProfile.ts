import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface User {
    id: string;
    email: string;
    username: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

const getUserProfile = async (): Promise<User> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
};

const updateUserProfile = async (
    data: Partial<Pick<User, 'username' | 'avatar_url'>>,
): Promise<User> => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
};

const uploadAvatar = async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/auth/profile/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export function useProfile() {
    return useQuery({
        queryKey: ['profile'],
        queryFn: getUserProfile,
        staleTime: 5 * 60 * 1000, // 5분
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateUserProfile,
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(['profile'], updatedUser);
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
        onError: (error) => {
            console.error('Profile update failed:', error);
        },
    });
}

export function useUploadAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: uploadAvatar,
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(['profile'], updatedUser);
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
        onError: (error) => {
            console.error('Avatar upload failed:', error);
        },
    });
}
