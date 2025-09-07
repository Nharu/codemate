import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
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
}
