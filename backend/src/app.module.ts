import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AiModule } from './modules/ai/ai.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        RedisModule,
        DatabaseModule,
        AuthModule,
        UsersModule,
        ProjectsModule,
        AiModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
