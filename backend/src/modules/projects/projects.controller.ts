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
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.interface';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) {}

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
}
