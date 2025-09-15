import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/project';

const fetchProjects = async (): Promise<Project[]> => {
    const response = await apiClient.get('/projects');
    return response.data;
};

const fetchProject = async (id: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
};

const createProject = async (data: CreateProjectData): Promise<Project> => {
    const response = await apiClient.post('/projects', data);
    return response.data;
};

const updateProject = async ({
    id,
    data,
}: {
    id: string;
    data: UpdateProjectData;
}): Promise<Project> => {
    const response = await apiClient.patch(`/projects/${id}`, data);
    return response.data;
};

const deleteProject = async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
};

export function useProjects() {
    return useQuery({
        queryKey: ['projects'],
        queryFn: fetchProjects,
        staleTime: 5 * 60 * 1000, // 5분
    });
}

export function useProject(id: string) {
    return useQuery({
        queryKey: ['projects', id],
        queryFn: () => fetchProject(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (error) => {
            console.error('Project creation failed:', error);
        },
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateProject,
        onSuccess: (updatedProject) => {
            queryClient.setQueryData(
                ['projects', updatedProject.id],
                updatedProject,
            );
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (error) => {
            console.error('Project update failed:', error);
        },
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (error) => {
            console.error('Project deletion failed:', error);
        },
    });
}
