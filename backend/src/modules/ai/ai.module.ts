import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiReviewGateway } from './ai-review.gateway';
import { AiReviewRecordService } from './ai-review-record.service';
import { AiReviewRecord } from './entities/ai-review-record.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([AiReviewRecord]),
        AuthModule, // This exports JwtModule
        UsersModule,
    ],
    controllers: [AiController],
    providers: [AiService, AiReviewGateway, AiReviewRecordService],
    exports: [AiService, AiReviewRecordService],
})
export class AiModule {}
