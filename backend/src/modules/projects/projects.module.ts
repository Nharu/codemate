import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './project.entity';
import { File } from './file.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Project, File]),
        MulterModule.register({
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB limit
            },
        }),
    ],
    controllers: [ProjectsController],
    providers: [ProjectsService],
    exports: [ProjectsService],
})
export class ProjectsModule {}
