import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectVisibility } from './project.entity';
import { File } from './file.entity';
import { ProjectMemberService } from './project-member.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import * as yauzl from 'yauzl';
import * as path from 'path';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        @InjectRepository(File)
        private fileRepository: Repository<File>,
        @Inject(forwardRef(() => ProjectMemberService))
        private projectMemberService: ProjectMemberService,
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

        // Check if user has access to the project (owner, member, or public)
        const hasAccess = await this.projectMemberService.hasProjectAccess(
            id,
            userId,
        );

        if (!hasAccess && project.visibility === ProjectVisibility.PRIVATE) {
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

        // If path is being updated, check for conflicts
        if (updateFileDto.path && updateFileDto.path !== file.path) {
            const existingFile = await this.fileRepository.findOne({
                where: { project_id: projectId, path: updateFileDto.path },
            });
            if (existingFile && existingFile.id !== fileId) {
                throw new ConflictException(
                    'File with this path already exists',
                );
            }
        }

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

    async deleteFolderFiles(
        projectId: string,
        folderPath: string,
        userId: string,
    ): Promise<void> {
        const project = await this.findOne(projectId, userId);

        if (project.owner_id !== userId) {
            throw new ForbiddenException('Only project owner can delete files');
        }

        // Find all files that start with the folder path
        const normalizedFolderPath = folderPath.endsWith('/')
            ? folderPath
            : folderPath + '/';

        const filesToDelete = await this.fileRepository.find({
            where: { project_id: projectId },
        });

        // Filter files that are in the folder (including subfolders)
        const folderFiles = filesToDelete.filter((file) =>
            file.path.startsWith(normalizedFolderPath),
        );

        if (folderFiles.length === 0) {
            throw new NotFoundException(
                'No files found in the specified folder',
            );
        }

        // Delete all files in the folder
        await this.fileRepository.remove(folderFiles);
    }

    async renameFolderFiles(
        projectId: string,
        oldFolderPath: string,
        newFolderPath: string,
        userId: string,
    ): Promise<File[]> {
        const project = await this.findOne(projectId, userId);

        if (project.owner_id !== userId) {
            throw new ForbiddenException(
                'Only project owner can rename folders',
            );
        }

        // Normalize folder paths
        const normalizedOldPath = oldFolderPath.endsWith('/')
            ? oldFolderPath
            : oldFolderPath + '/';
        const normalizedNewPath = newFolderPath.endsWith('/')
            ? newFolderPath
            : newFolderPath + '/';

        // Find all files in the folder
        const allFiles = await this.fileRepository.find({
            where: { project_id: projectId },
        });

        const folderFiles = allFiles.filter((file) =>
            file.path.startsWith(normalizedOldPath),
        );

        if (folderFiles.length === 0) {
            throw new NotFoundException(
                'No files found in the specified folder',
            );
        }

        // Check for conflicts with new paths
        const updatedFiles: File[] = [];
        for (const file of folderFiles) {
            const newPath = file.path.replace(
                normalizedOldPath,
                normalizedNewPath,
            );

            // Check if new path already exists
            const existingFile = await this.fileRepository.findOne({
                where: { project_id: projectId, path: newPath },
            });

            if (existingFile && existingFile.id !== file.id) {
                throw new ConflictException(
                    `File with path "${newPath}" already exists`,
                );
            }

            // Update the file path
            file.path = newPath;
            const updatedFile = await this.fileRepository.save(file);
            updatedFiles.push(updatedFile);
        }

        return updatedFiles;
    }

    async uploadZipFile(
        projectId: string,
        zipBuffer: Buffer,
        userId: string,
    ): Promise<File[]> {
        const project = await this.findOne(projectId, userId);

        if (project.owner_id !== userId) {
            throw new ForbiddenException('Only project owner can upload files');
        }

        return new Promise((resolve, reject) => {
            const createdFiles: File[] = [];

            yauzl.fromBuffer(
                zipBuffer,
                { lazyEntries: true },
                (err, zipfile) => {
                    if (err) {
                        reject(new ConflictException('Invalid ZIP file'));
                        return;
                    }

                    if (!zipfile) {
                        reject(
                            new ConflictException('Could not read ZIP file'),
                        );
                        return;
                    }

                    const processNextEntry = () => {
                        zipfile.readEntry();
                    };

                    zipfile.on('entry', (entry: yauzl.Entry) => {
                        // Skip directories and hidden files
                        if (
                            entry.fileName.endsWith('/') ||
                            entry.fileName.startsWith('.') ||
                            entry.fileName.includes('/.') ||
                            entry.fileName.includes('__MACOSX')
                        ) {
                            processNextEntry();
                            return;
                        }

                        // Skip files that are too large (10MB limit)
                        if (entry.uncompressedSize > 10 * 1024 * 1024) {
                            processNextEntry();
                            return;
                        }

                        zipfile.openReadStream(entry, (err, readStream) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            if (!readStream) {
                                processNextEntry();
                                return;
                            }

                            const chunks: Buffer[] = [];
                            readStream.on('data', (chunk: Buffer) =>
                                chunks.push(chunk),
                            );
                            readStream.on('end', () => {
                                void (async () => {
                                    try {
                                        const content =
                                            Buffer.concat(chunks).toString(
                                                'utf-8',
                                            );
                                        const filePath = entry.fileName.replace(
                                            /\\/g,
                                            '/',
                                        ); // Normalize path separators

                                        // Detect language from file extension
                                        const ext = path
                                            .extname(filePath)
                                            .toLowerCase();
                                        const languageMap: Record<
                                            string,
                                            string
                                        > = {
                                            '.js': 'javascript',
                                            '.jsx': 'javascript',
                                            '.ts': 'typescript',
                                            '.tsx': 'typescript',
                                            '.py': 'python',
                                            '.java': 'java',
                                            '.cpp': 'cpp',
                                            '.c': 'c',
                                            '.h': 'c',
                                            '.go': 'go',
                                            '.rs': 'rust',
                                            '.php': 'php',
                                            '.rb': 'ruby',
                                            '.swift': 'swift',
                                            '.kt': 'kotlin',
                                            '.html': 'html',
                                            '.css': 'css',
                                            '.scss': 'scss',
                                            '.json': 'json',
                                            '.yaml': 'yaml',
                                            '.yml': 'yaml',
                                            '.md': 'markdown',
                                            '.txt': 'text',
                                            '.xml': 'xml',
                                            '.sh': 'bash',
                                        };

                                        const language =
                                            languageMap[ext] || undefined;

                                        // Check if file already exists
                                        const existingFile =
                                            await this.fileRepository.findOne({
                                                where: {
                                                    project_id: projectId,
                                                    path: filePath,
                                                },
                                            });

                                        let file: File;
                                        if (existingFile) {
                                            // Update existing file
                                            existingFile.content = content;
                                            if (language)
                                                existingFile.language =
                                                    language;
                                            existingFile.size =
                                                Buffer.byteLength(
                                                    content,
                                                    'utf8',
                                                );
                                            file =
                                                await this.fileRepository.save(
                                                    existingFile,
                                                );
                                        } else {
                                            // Create new file
                                            file = this.fileRepository.create({
                                                project_id: projectId,
                                                path: filePath,
                                                content,
                                                ...(language && { language }),
                                                size: Buffer.byteLength(
                                                    content,
                                                    'utf8',
                                                ),
                                            });
                                            file =
                                                await this.fileRepository.save(
                                                    file,
                                                );
                                        }

                                        createdFiles.push(file);
                                        processNextEntry();
                                    } catch (error) {
                                        reject(
                                            error instanceof Error
                                                ? error
                                                : new Error(String(error)),
                                        );
                                    }
                                })();

                                readStream.on('error', (err) => {
                                    reject(err);
                                });
                            });
                        });
                    });

                    zipfile.on('end', () => {
                        resolve(createdFiles);
                    });

                    zipfile.on('error', (err) => {
                        reject(
                            err instanceof Error ? err : new Error(String(err)),
                        );
                    });

                    processNextEntry();
                },
            );
        });
    }
}
