import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'User email address',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'john_doe',
        description: 'Username (minimum 2 characters)',
        minLength: 2,
    })
    @IsString()
    @MinLength(2)
    username: string;

    @ApiProperty({
        example: 'password123',
        description: 'Password (minimum 6 characters)',
        minLength: 6,
    })
    @IsString()
    @MinLength(6)
    password: string;
}
