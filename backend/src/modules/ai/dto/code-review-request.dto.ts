import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum SupportedLanguage {
    TYPESCRIPT = 'typescript',
    JAVASCRIPT = 'javascript',
    PYTHON = 'python',
    JAVA = 'java',
    CPP = 'cpp',
    CSHARP = 'csharp',
    GO = 'go',
    RUST = 'rust',
}

export class CodeReviewRequestDto {
    @ApiProperty({
        description: 'The code to be reviewed',
        example: `function calculateSum(a: number, b: number): number {
    return a + b;
}`,
    })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({
        description: 'Programming language of the code',
        enum: SupportedLanguage,
        example: SupportedLanguage.TYPESCRIPT,
    })
    @IsEnum(SupportedLanguage)
    language: SupportedLanguage;

    @ApiProperty({
        description:
            'Optional context or description of what the code should do',
        example: 'This function should calculate the sum of two numbers',
        required: false,
    })
    @IsOptional()
    @IsString()
    context?: string;

    @ApiProperty({
        description: 'File path for better context (optional)',
        example: 'src/utils/math.ts',
        required: false,
    })
    @IsOptional()
    @IsString()
    filePath?: string;
}
