import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'User email address',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: '***REMOVED***123',
        description: 'User ***REMOVED***',
    })
    @IsString()
    ***REMOVED***: string;
}
