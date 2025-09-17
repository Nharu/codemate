import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    ParseUUIDPipe,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { ProjectMemberService } from './project-member.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.interface';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
    constructor(
        private readonly projectsService: ProjectsService,
        private readonly projectMemberService: ProjectMemberService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create a new project' })
    @ApiResponse({ status: 201, description: 'Project created successfully' })
    @ApiResponse({ status: 409, description: 'Project name already exists' })
    create(
        @Body() createProjectDto: CreateProjectDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.projectsService.create(createProjectDto, req.user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all projects for the current user' })
    @ApiResponse({
        status: 200,
        description: 'Projects retrieved successfully',
    })
    findAll(@Request() req: AuthenticatedRequest) {
        return this.projectsService.findAll(req.user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific project' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Project not found' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.projectsService.findOne(id, req.user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a project' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Project updated successfully' })
    @ApiResponse({ status: 403, description: 'Only project owner can update' })
    @ApiResponse({ status: 404, description: 'Project not found' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateProjectDto: UpdateProjectDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.projectsService.update(id, updateProjectDto, req.user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a project' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Project deleted successfully' })
    @ApiResponse({ status: 403, description: 'Only project owner can delete' })
    @ApiResponse({ status: 404, description: 'Project not found' })
    remove(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.projectsService.remove(id, req.user.id);
    }

    // File management endpoints
    @Post(':id/files')
    @ApiOperation({ summary: 'Add a file to the project' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiResponse({ status: 201, description: 'File created successfully' })
    @ApiResponse({ status: 409, description: 'File path already exists' })
    @ApiResponse({
        status: 403,
        description: 'Only project owner can add files',
    })
    createFile(
        @Param('id', ParseUUIDPipe) projectId: string,
        @Body() createFileDto: CreateFileDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.projectsService.createFile(
            projectId,
            createFileDto,
            req.user.id,
        );
    }

    @Get(':id/files')
    @ApiOperation({ summary: 'Get all files in the project' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
    getProjectFiles(
        @Param('id', ParseUUIDPipe) projectId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.projectsService.getProjectFiles(projectId, req.user.id);
    }

    @Get(':id/files/:fileId')
    @ApiOperation({ summary: 'Get a specific file' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiParam({ name: 'fileId', description: 'File ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'File retrieved successfully' })
    @ApiResponse({ status: 404, description: 'File not found' })
    getFile(
        @Param('id', ParseUUIDPipe) projectId: string,
        @Param('fileId', ParseUUIDPipe) fileId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.projectsService.getFile(projectId, fileId, req.user.id);
    }

    @Patch(':id/files/:fileId')
    @ApiOperation({ summary: 'Update a file' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiParam({ name: 'fileId', description: 'File ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'File updated successfully' })
    @ApiResponse({
        status: 403,
        description: 'Only project owner can update files',
    })
    @ApiResponse({ status: 404, description: 'File not found' })
    updateFile(
        @Param('id', ParseUUIDPipe) projectId: string,
        @Param('fileId', ParseUUIDPipe) fileId: string,
        @Body() updateFileDto: UpdateFileDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.projectsService.updateFile(
            projectId,
            fileId,
            updateFileDto,
            req.user.id,
        );
    }

    @Delete(':id/files/:fileId')
    @ApiOperation({ summary: 'Delete a file' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiParam({ name: 'fileId', description: 'File ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'File deleted successfully' })
    @ApiResponse({
        status: 403,
        description: 'Only project owner can delete files',
    })
    @ApiResponse({ status: 404, description: 'File not found' })
    deleteFile(
        @Param('id', ParseUUIDPipe) projectId: string,
        @Param('fileId', ParseUUIDPipe) fileId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.projectsService.deleteFile(projectId, fileId, req.user.id);
    }

    @Delete(':id/folders/*')
    @ApiOperation({ summary: 'Delete all files in a folder' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Folder deleted successfully' })
    @ApiResponse({
        status: 403,
        description: 'Only project owner can delete folders',
    })
    @ApiResponse({ status: 404, description: 'Folder not found' })
    async deleteFolder(
        @Param('id', ParseUUIDPipe) projectId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        // Extract folder path from the remaining URL
        const folderPath = req.url.split(`/projects/${projectId}/folders/`)[1];
        const decodedFolderPath = decodeURIComponent(folderPath);

        return await this.projectsService.deleteFolderFiles(
            projectId,
            decodedFolderPath,
            req.user.id,
        );
    }

    @Patch(':id/folders/*')
    @ApiOperation({
        summary: 'Rename a folder (updates all files in the folder)',
    })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiResponse({ status: 200, description: 'Folder renamed successfully' })
    @ApiResponse({
        status: 403,
        description: 'Only project owner can rename folders',
    })
    @ApiResponse({ status: 404, description: 'Folder not found' })
    async renameFolder(
        @Param('id', ParseUUIDPipe) projectId: string,
        @Body() body: { newPath: string },
        @Request() req: AuthenticatedRequest,
    ) {
        // Extract folder path from the remaining URL
        const folderPath = req.url
            .split(`/projects/${projectId}/folders/`)[1]
            .split('?')[0];
        const decodedFolderPath = decodeURIComponent(folderPath);

        return await this.projectsService.renameFolderFiles(
            projectId,
            decodedFolderPath,
            body.newPath,
            req.user.id,
        );
    }

    @Post(':id/upload-zip')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload ZIP file to extract multiple files' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
    @ApiResponse({ status: 400, description: 'Invalid file or ZIP format' })
    @ApiResponse({
        status: 403,
        description: 'Only project owner can upload files',
    })
    async uploadZip(
        @Param('id', ParseUUIDPipe) projectId: string,
        @UploadedFile() file: Express.Multer.File,
        @Request() req: AuthenticatedRequest,
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        if (!file.originalname.toLowerCase().endsWith('.zip')) {
            throw new BadRequestException('Only ZIP files are allowed');
        }

        if (file.size > 50 * 1024 * 1024) {
            throw new BadRequestException('ZIP file size cannot exceed 50MB');
        }

        return await this.projectsService.uploadZipFile(
            projectId,
            file.buffer,
            req.user.id,
        );
    }

    // Project Member Management APIs

    @Get(':id/members')
    @ApiOperation({ summary: 'Get project members' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiResponse({
        status: 200,
        description: 'Project members retrieved successfully',
    })
    @ApiResponse({ status: 403, description: 'Access denied' })
    async getProjectMembers(
        @Param('id', ParseUUIDPipe) projectId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        // Check if user has access to the project
        const hasAccess = await this.projectMemberService.hasProjectAccess(
            projectId,
            req.user.id,
        );

        if (!hasAccess) {
            throw new BadRequestException('프로젝트에 접근할 권한이 없습니다.');
        }

        return await this.projectMemberService.getProjectMembers(projectId);
    }

    @Post(':id/members')
    @ApiOperation({ summary: 'Add a member to project' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiResponse({ status: 201, description: 'Member added successfully' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 400, description: 'User already a member' })
    async addProjectMember(
        @Param('id', ParseUUIDPipe) projectId: string,
        @Body() addMemberDto: AddProjectMemberDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return await this.projectMemberService.addMember(
            projectId,
            addMemberDto.email,
            addMemberDto.role,
            req.user.id,
        );
    }

    @Delete(':id/members/:userId')
    @ApiOperation({ summary: 'Remove a member from project' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiParam({
        name: 'userId',
        description: 'User ID to remove',
        type: 'string',
    })
    @ApiResponse({ status: 200, description: 'Member removed successfully' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    @ApiResponse({ status: 404, description: 'Member not found' })
    async removeProjectMember(
        @Param('id', ParseUUIDPipe) projectId: string,
        @Param('userId', ParseUUIDPipe) userId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        await this.projectMemberService.removeMember(
            projectId,
            userId,
            req.user.id,
        );
        return { message: '멤버가 성공적으로 제거되었습니다.' };
    }

    @Patch(':id/members/:userId/role')
    @ApiOperation({ summary: 'Update member role in project' })
    @ApiParam({ name: 'id', description: 'Project ID', type: 'string' })
    @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
    @ApiResponse({
        status: 200,
        description: 'Member role updated successfully',
    })
    @ApiResponse({ status: 403, description: 'Access denied' })
    @ApiResponse({ status: 404, description: 'Member not found' })
    async updateMemberRole(
        @Param('id', ParseUUIDPipe) projectId: string,
        @Param('userId', ParseUUIDPipe) userId: string,
        @Body() updateRoleDto: UpdateMemberRoleDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return await this.projectMemberService.updateMemberRole(
            projectId,
            userId,
            updateRoleDto.role,
            req.user.id,
        );
    }

    @Get('shared')
    @ApiOperation({ summary: 'Get projects shared with current user' })
    @ApiResponse({
        status: 200,
        description: 'Shared projects retrieved successfully',
    })
    async getSharedProjects(@Request() req: AuthenticatedRequest) {
        return await this.projectMemberService.getUserProjects(req.user.id);
    }
}
