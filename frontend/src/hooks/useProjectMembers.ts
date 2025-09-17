import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type {
    ProjectMember,
    AddProjectMemberData,
    UpdateMemberRoleData,
    Project,
} from '@/types/project';
import { toast } from 'sonner';

// 프로젝트 멤버 목록 조회
export const useProjectMembers = (projectId: string) => {
    return useQuery<ProjectMember[]>({
        queryKey: ['projects', projectId, 'members'],
        queryFn: async () => {
            const response = await apiClient.get(
                `/projects/${projectId}/members`,
            );
            return response.data;
        },
        enabled: !!projectId,
    });
};

// 프로젝트 멤버 추가
export const useAddProjectMember = (projectId: string) => {
    const queryClient = useQueryClient();

    return useMutation<ProjectMember, Error, AddProjectMemberData>({
        mutationFn: async (data) => {
            const response = await apiClient.post(
                `/projects/${projectId}/members`,
                data,
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['projects', projectId, 'members'],
            });
            toast.success('멤버가 성공적으로 추가되었습니다.');
        },
        onError: (
            error: Error & { response?: { data?: { message?: string } } },
        ) => {
            const message =
                error.response?.data?.message || '멤버 추가에 실패했습니다.';
            toast.error(message);
        },
    });
};

// 프로젝트 멤버 제거
export const useRemoveProjectMember = (projectId: string) => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: async (userId) => {
            await apiClient.delete(`/projects/${projectId}/members/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['projects', projectId, 'members'],
            });
            toast.success('멤버가 성공적으로 제거되었습니다.');
        },
        onError: (
            error: Error & { response?: { data?: { message?: string } } },
        ) => {
            const message =
                error.response?.data?.message || '멤버 제거에 실패했습니다.';
            toast.error(message);
        },
    });
};

// 프로젝트 멤버 역할 변경
export const useUpdateMemberRole = (projectId: string) => {
    const queryClient = useQueryClient();

    return useMutation<
        ProjectMember,
        Error,
        { userId: string; data: UpdateMemberRoleData }
    >({
        mutationFn: async ({ userId, data }) => {
            const response = await apiClient.patch(
                `/projects/${projectId}/members/${userId}/role`,
                data,
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['projects', projectId, 'members'],
            });
            toast.success('멤버 역할이 성공적으로 변경되었습니다.');
        },
        onError: (
            error: Error & { response?: { data?: { message?: string } } },
        ) => {
            const message =
                error.response?.data?.message || '역할 변경에 실패했습니다.';
            toast.error(message);
        },
    });
};

// 공유받은 프로젝트 목록 조회
export const useSharedProjects = () => {
    return useQuery<Project[]>({
        queryKey: ['projects', 'shared'],
        queryFn: async () => {
            const response = await apiClient.get('/projects/shared');
            return response.data;
        },
    });
};
