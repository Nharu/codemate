import { ApiProperty } from '@nestjs/swagger';

export enum ReviewSeverity {
    INFO = 'info',
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export enum ReviewCategory {
    BUG = 'bug',
    SECURITY = 'security',
    PERFORMANCE = 'performance',
    STYLE = 'style',
    MAINTAINABILITY = 'maintainability',
    BEST_PRACTICES = 'best_practices',
}

export class ReviewIssue {
    @ApiProperty({
        description: 'Line number where the issue occurs',
        example: 5,
    })
    line: number;

    @ApiProperty({
        description: 'Column number where the issue starts',
        example: 12,
        required: false,
    })
    column?: number;

    @ApiProperty({
        description: 'Severity level of the issue',
        enum: ReviewSeverity,
        example: ReviewSeverity.MEDIUM,
    })
    severity: ReviewSeverity;

    @ApiProperty({
        description: 'Category of the issue',
        enum: ReviewCategory,
        example: ReviewCategory.BUG,
    })
    category: ReviewCategory;

    @ApiProperty({
        description: 'Title or short description of the issue',
        example: 'Potential null pointer exception',
    })
    title: string;

    @ApiProperty({
        description: 'Detailed description of the issue',
        example:
            'The variable "user" might be null at this point, which could cause a runtime error.',
    })
    description: string;

    @ApiProperty({
        description: 'Suggested fix for the issue',
        example:
            'Add a null check before accessing user properties: if (user && user.name) { ... }',
        required: false,
    })
    suggestion?: string;

    @ApiProperty({
        description: 'Code snippet showing the suggested fix',
        example: 'if (user && user.name) {\n    console.log(user.name);\n}',
        required: false,
    })
    suggestedCode?: string;
}

export class CodeReviewResponseDto {
    @ApiProperty({
        description: 'Overall score of the code quality (0-100)',
        example: 85,
        minimum: 0,
        maximum: 100,
    })
    overallScore: number;

    @ApiProperty({
        description: 'Summary of the code review',
        example:
            'The code is well-structured but has a few potential issues that should be addressed.',
    })
    summary: string;

    @ApiProperty({
        description: 'List of identified issues',
        type: [ReviewIssue],
    })
    issues: ReviewIssue[];

    @ApiProperty({
        description: 'General suggestions for improvement',
        type: [String],
        example: [
            'Consider adding unit tests',
            'Add input validation',
            'Improve error handling',
        ],
    })
    suggestions: string[];

    @ApiProperty({
        description: 'Positive aspects of the code',
        type: [String],
        example: [
            'Good variable naming',
            'Clear function structure',
            'Proper TypeScript usage',
        ],
    })
    strengths: string[];

    @ApiProperty({
        description: 'Time taken to perform the review in milliseconds',
        example: 1250,
    })
    reviewTime: number;
}
