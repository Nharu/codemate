import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OAuthDto {
    @ApiProperty({
        description: 'OAuth provider name',
        example: 'github',
    })
    @IsString()
    provider: string;

    @ApiProperty({
        description: 'Provider-specific user ID',
        example: '12345678',
    })
    @IsString()
    providerId: string;

    @ApiProperty({
        description: 'User email from OAuth provider',
        example: 'user@example.com',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Username from OAuth provider',
        example: 'johndoe',
    })
    @IsString()
    username: string;

    @ApiProperty({
        description: 'Avatar URL from OAuth provider',
        example: 'https://github.com/user.png',
        required: false,
    })
    @IsOptional()
    @IsString()
    avatar_url?: string;
}
