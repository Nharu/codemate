import {
    Controller,
    Post,
    Get,
    Body,
    Query,
    UseGuards,
    HttpException,
    HttpStatus,
    Request,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiReviewRecordService } from './ai-review-record.service';
import { CodeReviewRequestDto } from './dto/code-review-request.dto';
import { CodeReviewResponseDto } from './dto/code-review-response.dto';

@ApiTags('AI Code Review')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
    constructor(
        private readonly aiService: AiService,
        private readonly reviewRecordService: AiReviewRecordService,
    ) {}

    @Post('review')
    @ApiOperation({
        summary: 'Request AI code review',
        description:
            'Submit code for AI-powered analysis and receive detailed feedback on potential issues, improvements, and best practices.',
    })
    @ApiResponse({
        status: 201,
        description: 'Code review completed successfully',
        type: CodeReviewResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid request data',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Validation failed',
                },
                error: {
                    type: 'string',
                    example: 'Bad Request',
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - JWT token required',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Unauthorized',
                },
            },
        },
    })
    @ApiResponse({
        status: 500,
        description: 'AI service error',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Failed to perform code review',
                },
                error: {
                    type: 'string',
                    example: 'Internal Server Error',
                },
            },
        },
    })
    async reviewCode(
        @Body() request: CodeReviewRequestDto,
    ): Promise<CodeReviewResponseDto> {
        try {
            return await this.aiService.reviewCode(request);
        } catch {
            throw new HttpException(
                'Failed to perform code review',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('review/latest')
    @ApiOperation({
        summary: 'Get latest review for a file',
        description:
            'Retrieve the most recent AI review result for a specific file',
    })
    @ApiQuery({
        name: 'projectId',
        description: 'Project ID',
        required: true,
    })
    @ApiQuery({
        name: 'filePath',
        description: 'File path',
        required: true,
    })
    @ApiResponse({
        status: 200,
        description: 'Latest review found',
    })
    @ApiResponse({
        status: 404,
        description: 'No review found for this file',
    })
    async getLatestReview(
        @Request() req: AuthenticatedRequest,
        @Query('projectId') projectId: string,
        @Query('filePath') filePath: string,
    ) {
        try {
            const record =
                await this.reviewRecordService.getLatestReviewForFile(
                    req.user.id,
                    projectId,
                    filePath,
                );

            if (!record) {
                throw new HttpException(
                    'No review found',
                    HttpStatus.NOT_FOUND,
                );
            }

            return record;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to get review record',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('review/history')
    @ApiOperation({
        summary: 'Get review history for a file',
        description: 'Retrieve review history for a specific file',
    })
    @ApiQuery({
        name: 'projectId',
        description: 'Project ID',
        required: true,
    })
    @ApiQuery({
        name: 'filePath',
        description: 'File path',
        required: true,
    })
    @ApiQuery({
        name: 'limit',
        description: 'Number of records to return',
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: 'Review history retrieved',
    })
    async getReviewHistory(
        @Request() req: AuthenticatedRequest,
        @Query('projectId') projectId: string,
        @Query('filePath') filePath: string,
        @Query('limit') limit?: string,
    ) {
        try {
            const records =
                await this.reviewRecordService.getReviewHistoryForFile(
                    req.user.id,
                    projectId,
                    filePath,
                    limit ? parseInt(limit, 10) : 10,
                );

            return records;
        } catch {
            throw new HttpException(
                'Failed to get review history',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('review/summary')
    @ApiOperation({
        summary: 'Get project review summary',
        description: 'Get summary statistics for all reviews in a project',
    })
    @ApiQuery({
        name: 'projectId',
        description: 'Project ID',
        required: true,
    })
    @ApiResponse({
        status: 200,
        description: 'Project review summary retrieved',
    })
    async getProjectSummary(
        @Request() req: AuthenticatedRequest,
        @Query('projectId') projectId: string,
    ) {
        try {
            const summary =
                await this.reviewRecordService.getProjectReviewSummary(
                    req.user.id,
                    projectId,
                );

            return summary;
        } catch {
            throw new HttpException(
                'Failed to get project summary',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
