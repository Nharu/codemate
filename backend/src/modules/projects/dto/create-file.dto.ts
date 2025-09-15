import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFileDto {
    @ApiProperty({
        description: 'File path within the project',
        example: 'src/components/Button.tsx',
        maxLength: 500,
    })
    @IsString()
    @MaxLength(500)
    path: string;

    @ApiProperty({
        description: 'File content',
        example:
            'import React from "react";\n\nexport const Button = () => {\n  return <button>Click me</button>;\n};',
    })
    @IsString()
    content: string;

    @ApiProperty({
        description: 'Programming language',
        example: 'typescript',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    language?: string;
}
