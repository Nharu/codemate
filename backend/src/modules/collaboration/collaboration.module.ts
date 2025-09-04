import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CollaborationGateway } from './collaboration.gateway';
import { CollaborationService } from './collaboration.service';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        UsersModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '7d' },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [CollaborationGateway, CollaborationService],
    exports: [CollaborationGateway, CollaborationService],
})
export class CollaborationModule {}
