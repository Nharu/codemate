import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectVisibility } from '../project.entity';

export class CreateProjectDto {
    @ApiProperty({
        description: 'Project name',
        example: 'My Awesome Project',
        maxLength: 100,
    })
    @IsString()
    @MaxLength(100)
    name: string;

    @ApiProperty({
        description: 'Project description',
        example: 'A collaborative coding project',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Project visibility',
        enum: ProjectVisibility,
        example: ProjectVisibility.PRIVATE,
        required: false,
    })
    @IsOptional()
    @IsEnum(ProjectVisibility)
    visibility?: ProjectVisibility;
}
