import {
    Controller,
    Post,
    Body,
    UseGuards,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CodeReviewRequestDto } from './dto/code-review-request.dto';
import { CodeReviewResponseDto } from './dto/code-review-response.dto';

@ApiTags('AI Code Review')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
    constructor(private readonly aiService: AiService) {}

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
}
