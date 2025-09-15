import {
    Controller,
    Post,
    Body,
    UseGuards,
    Get,
    Put,
    Request,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { OAuthDto } from './dto/oauth.dto';
import { User } from '../users/user.entity';
import { StorageService } from '../storage/storage.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly storageService: StorageService,
    ) {}

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async register(@Body() registerDto: RegisterDto) {
        return await this.authService.register(registerDto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, description: 'User successfully logged in' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto) {
        return await this.authService.login(loginDto);
    }

    @Post('oauth')
    @ApiOperation({ summary: 'OAuth login/register' })
    @ApiResponse({
        status: 200,
        description: 'OAuth user logged in successfully',
    })
    @ApiResponse({
        status: 201,
        description: 'OAuth user registered successfully',
    })
    async oauth(@Body() oauthDto: OAuthDto) {
        return await this.authService.oauthLogin(oauthDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getProfile(@Request() req: { user: User }) {
        const { password: _, ...userWithoutPassword } = req.user;
        return {
            ...userWithoutPassword,
            hasPassword: req.user.password !== null,
        };
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update user profile' })
    @ApiResponse({ status: 200, description: 'Profile updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async updateProfile(
        @Request() req: { user: User },
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        const updatedUser = await this.authService.updateProfile(
            req.user.id,
            updateProfileDto,
        );
        const { password: _, ...userWithoutPassword } = updatedUser;
        return {
            ...userWithoutPassword,
            hasPassword: updatedUser.password !== null,
        };
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('profile/avatar')
    @UseInterceptors(FileInterceptor('avatar'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Upload user avatar' })
    @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
    @ApiResponse({ status: 400, description: 'Invalid file' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async uploadAvatar(
        @Request() req: { user: User },
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // Validate the image file
        this.storageService.validateImageFile(file);

        // Delete old avatar if exists
        if (req.user.avatar_url) {
            try {
                await this.storageService.deleteFile(req.user.avatar_url);
            } catch (error) {
                // Log but don't fail if old file deletion fails
                console.warn('Failed to delete old avatar:', error);
            }
        }

        // Upload new avatar
        const avatarUrl = await this.storageService.uploadFile(file, 'avatars');

        // Update user profile with new avatar URL
        const updatedUser = await this.authService.updateProfile(req.user.id, {
            avatar_url: avatarUrl,
        });

        const { password: _, ...userWithoutPassword } = updatedUser;
        return {
            ...userWithoutPassword,
            hasPassword: updatedUser.password !== null,
        };
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('change-password')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change user password' })
    @ApiResponse({ status: 200, description: 'Password changed successfully' })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized or incorrect current password',
    })
    async changePassword(
        @Request() req: { user: User },
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        await this.authService.changePassword(req.user.id, changePasswordDto);
        return { message: 'Password changed successfully' };
    }
}
