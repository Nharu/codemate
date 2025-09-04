import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async create(registerDto: RegisterDto): Promise<User> {
        const { email, username, ***REMOVED*** } = registerDto;

        const hashedPassword = await bcrypt.hash(***REMOVED***, 10);

        const user = this.userRepository.create({
            email,
            username,
            ***REMOVED***: hashedPassword,
        });

        return await this.userRepository.save(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepository.findOne({ where: { email } });
    }

    async findById(id: string): Promise<User | null> {
        return await this.userRepository.findOne({ where: { id } });
    }

    async validatePassword(
        plainPassword: string,
        hashedPassword: string,
    ): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}
