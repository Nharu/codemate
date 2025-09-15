import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: (configService: ConfigService): Redis => {
                const redisUrl = configService.get<string>('REDIS_URL');
                if (!redisUrl) {
                    throw new Error(
                        'REDIS_URL environment variable is required',
                    );
                }
                return new Redis(redisUrl);
            },
            inject: [ConfigService],
        },
        RedisService,
    ],
    exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
