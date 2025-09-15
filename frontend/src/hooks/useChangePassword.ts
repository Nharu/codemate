import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

interface ChangePasswordResponse {
    message: string;
}

export const useChangePassword = () => {
    return useMutation<ChangePasswordResponse, Error, ChangePasswordData>({
        mutationFn: async (data: ChangePasswordData) => {
            const response = await apiClient.put('/auth/change-password', data);
            return response.data;
        },
    });
};
