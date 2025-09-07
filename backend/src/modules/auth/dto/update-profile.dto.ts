import { IsOptional, IsString, IsUrl, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
    @ApiProperty({ description: 'Username', required: false })
    @IsOptional()
    @IsString()
    @Length(2, 50, { message: 'Username must be between 2 and 50 characters' })
    username?: string;

    @ApiProperty({ description: 'Avatar URL', required: false })
    @IsOptional()
    @IsUrl({}, { message: 'Invalid URL format' })
    avatar_url?: string;
}
