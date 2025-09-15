import { Module } from '@nestjs/common';
import { CollaborationGateway } from './collaboration.gateway';
import { CollaborationService } from './collaboration.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [UsersModule, AuthModule],
    providers: [CollaborationGateway, CollaborationService],
    exports: [CollaborationGateway, CollaborationService],
})
export class CollaborationModule {}
