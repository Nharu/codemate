import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { File, CreateFileData, UpdateFileData } from '@/types/project';

const fetchProjectFiles = async (projectId: string): Promise<File[]> => {
    const response = await apiClient.get(`/projects/${projectId}/files`);
    return response.data;
};

const fetchFile = async (projectId: string, fileId: string): Promise<File> => {
    const response = await apiClient.get(
        `/projects/${projectId}/files/${fileId}`,
    );
    return response.data;
};

const createFile = async ({
    projectId,
    data,
}: {
    projectId: string;
    data: CreateFileData;
}): Promise<File> => {
    const response = await apiClient.post(`/projects/${projectId}/files`, data);
    return response.data;
};

const updateFile = async ({
    projectId,
    fileId,
    data,
}: {
    projectId: string;
    fileId: string;
    data: UpdateFileData;
}): Promise<File> => {
    const response = await apiClient.patch(
        `/projects/${projectId}/files/${fileId}`,
        data,
    );
    return response.data;
};

const deleteFile = async (projectId: string, fileId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/files/${fileId}`);
};

export function useProjectFiles(projectId: string) {
    return useQuery({
        queryKey: ['projects', projectId, 'files'],
        queryFn: () => fetchProjectFiles(projectId),
        enabled: !!projectId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useFile(projectId: string, fileId: string) {
    return useQuery({
        queryKey: ['projects', projectId, 'files', fileId],
        queryFn: () => fetchFile(projectId, fileId),
        enabled: !!projectId && !!fileId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createFile,
        onSuccess: (newFile) => {
            queryClient.invalidateQueries({
                queryKey: ['projects', newFile.project_id, 'files'],
            });
        },
        onError: (error) => {
            console.error('File creation failed:', error);
        },
    });
}

export function useUpdateFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateFile,
        onSuccess: (updatedFile) => {
            queryClient.setQueryData(
                ['projects', updatedFile.project_id, 'files', updatedFile.id],
                updatedFile,
            );
            queryClient.invalidateQueries({
                queryKey: ['projects', updatedFile.project_id, 'files'],
            });
        },
        onError: (error) => {
            console.error('File update failed:', error);
        },
    });
}

export function useDeleteFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            projectId,
            fileId,
        }: {
            projectId: string;
            fileId: string;
        }) => deleteFile(projectId, fileId),
        onSuccess: (_, { projectId }) => {
            queryClient.invalidateQueries({
                queryKey: ['projects', projectId, 'files'],
            });
        },
        onError: (error) => {
            console.error('File deletion failed:', error);
        },
    });
}
