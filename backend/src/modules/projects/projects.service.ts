import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectVisibility } from './project.entity';
import { File } from './file.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        @InjectRepository(File)
        private fileRepository: Repository<File>,
    ) {}

    async create(
        createProjectDto: CreateProjectDto,
        userId: string,
    ): Promise<Project> {
        // Check if project name already exists for this user
        const existingProject = await this.projectRepository.findOne({
            where: { name: createProjectDto.name, owner_id: userId },
        });

        if (existingProject) {
            throw new ConflictException(
                'Project with this name already exists',
            );
        }

        const project = this.projectRepository.create({
            ...createProjectDto,
            owner_id: userId,
        });

        return this.projectRepository.save(project);
    }

    async findAll(userId: string): Promise<Project[]> {
        return this.projectRepository.find({
            where: { owner_id: userId },
            order: { updated_at: 'DESC' },
        });
    }

    async findOne(id: string, userId: string): Promise<Project> {
        const project = await this.projectRepository.findOne({
            where: { id },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        // Check if user owns the project or if it's public
        if (
            project.owner_id !== userId &&
            project.visibility === ProjectVisibility.PRIVATE
        ) {
            throw new ForbiddenException('Access denied to this project');
        }

        return project;
    }

    async update(
        id: string,
        updateProjectDto: UpdateProjectDto,
        userId: string,
    ): Promise<Project> {
        const project = await this.findOne(id, userId);

        if (project.owner_id !== userId) {
            throw new ForbiddenException(
                'Only project owner can update the project',
            );
        }

        Object.assign(project, updateProjectDto);
        return this.projectRepository.save(project);
    }

    async remove(id: string, userId: string): Promise<void> {
        const project = await this.findOne(id, userId);

        if (project.owner_id !== userId) {
            throw new ForbiddenException(
                'Only project owner can delete the project',
            );
        }

        await this.projectRepository.remove(project);
    }

    // File management methods
    async createFile(
        projectId: string,
        createFileDto: CreateFileDto,
        userId: string,
    ): Promise<File> {
        const project = await this.findOne(projectId, userId);

        if (project.owner_id !== userId) {
            throw new ForbiddenException('Only project owner can add files');
        }

        // Check if file path already exists in this project
        const existingFile = await this.fileRepository.findOne({
            where: { project_id: projectId, path: createFileDto.path },
        });

        if (existingFile) {
            throw new ConflictException('File with this path already exists');
        }

        const file = this.fileRepository.create({
            ...createFileDto,
            project_id: projectId,
            size: Buffer.byteLength(createFileDto.content, 'utf8'),
        });

        return this.fileRepository.save(file);
    }

    async getProjectFiles(projectId: string, userId: string): Promise<File[]> {
        await this.findOne(projectId, userId); // Check access

        return this.fileRepository.find({
            where: { project_id: projectId },
            order: { path: 'ASC' },
        });
    }

    async getFile(
        projectId: string,
        fileId: string,
        userId: string,
    ): Promise<File> {
        await this.findOne(projectId, userId); // Check access

        const file = await this.fileRepository.findOne({
            where: { id: fileId, project_id: projectId },
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        return file;
    }

    async updateFile(
        projectId: string,
        fileId: string,
        updateFileDto: UpdateFileDto,
        userId: string,
    ): Promise<File> {
        const project = await this.findOne(projectId, userId);

        if (project.owner_id !== userId) {
            throw new ForbiddenException('Only project owner can update files');
        }

        const file = await this.getFile(projectId, fileId, userId);

        Object.assign(file, updateFileDto);
        if (updateFileDto.content) {
            file.size = Buffer.byteLength(updateFileDto.content, 'utf8');
        }

        return this.fileRepository.save(file);
    }

    async deleteFile(
        projectId: string,
        fileId: string,
        userId: string,
    ): Promise<void> {
        const project = await this.findOne(projectId, userId);

        if (project.owner_id !== userId) {
            throw new ForbiddenException('Only project owner can delete files');
        }

        const file = await this.getFile(projectId, fileId, userId);
        await this.fileRepository.remove(file);
    }
}
