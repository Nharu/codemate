import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { IdeSessionService } from './ide-session.service';
import { IdeSessionGateway } from './ide-session.gateway';
import { ProjectMemberService } from './project-member.service';
import { Project } from './project.entity';
import { File } from './file.entity';
import { ProjectMember } from './project-member.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Project, File, ProjectMember]),
        UsersModule,
        AuthModule,
        MulterModule.register({
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB limit
            },
        }),
    ],
    controllers: [ProjectsController],
    providers: [
        ProjectsService,
        IdeSessionService,
        IdeSessionGateway,
        ProjectMemberService,
    ],
    exports: [ProjectsService, ProjectMemberService],
})
export class ProjectsModule {}
