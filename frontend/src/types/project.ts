export enum ProjectVisibility {
    PUBLIC = 'public',
    PRIVATE = 'private',
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    owner_id: string;
    owner: {
        id: string;
        email: string;
        username: string;
        avatar_url?: string;
    };
    visibility: ProjectVisibility;
    created_at: string;
    updated_at: string;
}

export interface File {
    id: string;
    project_id: string;
    path: string;
    content: string;
    language?: string;
    size: number;
    created_at: string;
    updated_at: string;
}

export interface CreateProjectData {
    name: string;
    description?: string;
    visibility?: ProjectVisibility;
}

export interface UpdateProjectData {
    name?: string;
    description?: string;
    visibility?: ProjectVisibility;
}

export interface CreateFileData {
    path: string;
    content: string;
    language?: string;
}

export interface UpdateFileData {
    path?: string;
    content?: string;
    language?: string;
}
