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
    // Additional fields for shared projects
    userRole?: ProjectRole;
    joinedAt?: string;
    invitedBy?: string;
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

export enum ProjectRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    MEMBER = 'member',
    VIEWER = 'viewer',
}

export interface ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    role: ProjectRole;
    invitedBy: string;
    joinedAt: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        email: string;
        username: string;
        avatar_url?: string;
    };
    inviter?: {
        id: string;
        email: string;
        username: string;
        avatar_url?: string;
    };
}

export interface AddProjectMemberData {
    email: string;
    role: ProjectRole;
}

export interface UpdateMemberRoleData {
    role: ProjectRole;
}
