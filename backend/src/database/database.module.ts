import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/users/user.entity';
import { Project } from '../modules/projects/project.entity';
import { File } from '../modules/projects/file.entity';
import { AiReviewRecord } from '../modules/ai/entities/ai-review-record.entity';
import { ProjectMember } from 'src/modules/projects/project-member.entity';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DATABASE_HOST'),
                port: configService.get<number>('DATABASE_PORT'),
                username: configService.get<string>('DATABASE_USERNAME'),
                password: configService.get<string>('DATABASE_PASSWORD'),
                database: configService.get<string>('DATABASE_NAME'),
                entities: [User, Project, File, AiReviewRecord, ProjectMember],
                synchronize:
                    configService.get<string>('NODE_ENV') !== 'production',
                logging: false,
            }),
            inject: [ConfigService],
        }),
    ],
})
export class DatabaseModule {}
