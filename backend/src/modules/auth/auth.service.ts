import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { StorageService } from '../storage/storage.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { OAuthDto } from './dto/oauth.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly storageService: StorageService,
    ) {}

    async register(
        registerDto: RegisterDto,
    ): Promise<{ access_token: string; user: Partial<User> }> {
        const existingUser = await this.usersService.findByEmail(
            registerDto.email,
        );

        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const user = await this.usersService.create(registerDto);
        const { password: _, ...userWithoutPassword } = user;

        const payload = { email: user.email, sub: user.id };
        const access_token = this.jwtService.sign(payload);

        return {
            access_token,
            user: userWithoutPassword,
        };
    }

    async login(
        loginDto: LoginDto,
    ): Promise<{ access_token: string; user: Partial<User> }> {
        const user = await this.usersService.findByEmail(loginDto.email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.password) {
            throw new UnauthorizedException(
                'This account was created with OAuth. Please use OAuth login.',
            );
        }

        const isPasswordValid = await this.usersService.validatePassword(
            loginDto.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const { password: _, ...userWithoutPassword } = user;
        const payload = { email: user.email, sub: user.id };
        const access_token = this.jwtService.sign(payload);

        return {
            access_token,
            user: userWithoutPassword,
        };
    }

    async validateUser(payload: {
        sub: string;
        email: string;
    }): Promise<User | null> {
        return await this.usersService.findById(payload.sub);
    }

    async updateProfile(
        userId: string,
        updateProfileDto: UpdateProfileDto,
    ): Promise<User> {
        return await this.usersService.updateProfile(userId, updateProfileDto);
    }

    async changePassword(
        userId: string,
        changePasswordDto: ChangePasswordDto,
    ): Promise<void> {
        const user = await this.usersService.findById(userId);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (!user.password) {
            throw new UnauthorizedException(
                'OAuth users cannot change password. Password is managed by OAuth provider.',
            );
        }

        const isCurrentPasswordValid = await this.usersService.validatePassword(
            changePasswordDto.currentPassword,
            user.password,
        );

        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        await this.usersService.updatePassword(
            userId,
            changePasswordDto.newPassword,
        );
    }

    private async downloadAndSaveAvatar(
        imageUrl: string,
    ): Promise<string | null> {
        if (!imageUrl) return null;

        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                console.warn(`Failed to download avatar from ${imageUrl}`);
                return null;
            }

            const buffer = await response.arrayBuffer();
            const contentType = response.headers.get('content-type');

            // 이미지 타입 검증
            if (!contentType?.startsWith('image/')) {
                console.warn(`Invalid content type: ${contentType}`);
                return null;
            }

            // 파일 확장자 결정
            let extension = 'jpg';
            if (contentType.includes('png')) extension = 'png';
            else if (contentType.includes('gif')) extension = 'gif';
            else if (contentType.includes('webp')) extension = 'webp';

            // 임시 파일 객체 생성 (multer File 인터페이스와 호환)
            const file = {
                buffer: Buffer.from(buffer),
                originalname: `avatar.${extension}`,
                mimetype: contentType,
                size: buffer.byteLength,
            } as Express.Multer.File;

            // StorageService를 사용해 업로드
            return await this.storageService.uploadFile(file, 'avatars');
        } catch (error) {
            console.error('Error downloading avatar:', error);
            return null;
        }
    }

    async oauthLogin(
        oauthDto: OAuthDto,
    ): Promise<{ access_token: string; user: Partial<User> }> {
        // 이메일로 기존 사용자 찾기
        const existingUser = await this.usersService.findByEmail(
            oauthDto.email,
        );

        if (existingUser) {
            // 기존 사용자가 일반 회원가입으로 가입한 경우 OAuth 로그인 거부
            if (existingUser.password) {
                throw new ConflictException(
                    'This email is already registered with a password. Please use email/password login.',
                );
            }

            // OAuth로 가입한 기존 사용자의 경우 로그인 처리
            const { password: _, ...userWithoutPassword } = existingUser;
            const payload = { email: existingUser.email, sub: existingUser.id };
            const access_token = this.jwtService.sign(payload);

            return {
                access_token,
                user: userWithoutPassword,
            };
        }

        // 새 OAuth 사용자 생성 - 프로필 이미지 다운로드 및 저장
        let avatarUrl = oauthDto.avatar_url;
        if (oauthDto.avatar_url) {
            const downloadedAvatarUrl = await this.downloadAndSaveAvatar(
                oauthDto.avatar_url,
            );
            if (downloadedAvatarUrl) {
                avatarUrl = downloadedAvatarUrl;
            }
        }

        const newUser = await this.usersService.createOAuthUser({
            email: oauthDto.email,
            username: oauthDto.username,
            avatar_url: avatarUrl,
        });

        const { password: _, ...userWithoutPassword } = newUser;
        const payload = { email: newUser.email, sub: newUser.id };
        const access_token = this.jwtService.sign(payload);

        return {
            access_token,
            user: userWithoutPassword,
        };
    }
}
