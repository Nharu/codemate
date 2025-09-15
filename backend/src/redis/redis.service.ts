import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
    private readonly logger = new Logger(RedisService.name);

    constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

    async get(key: string): Promise<string | null> {
        try {
            return await this.redis.get(key);
        } catch (error) {
            this.logger.error(
                `Failed to get key ${key}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
        }
    }

    async set(key: string, value: string): Promise<void> {
        try {
            await this.redis.set(key, value);
        } catch (error) {
            this.logger.error(
                `Failed to set key ${key}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
        }
    }

    async setex(key: string, seconds: number, value: string): Promise<void> {
        try {
            await this.redis.setex(key, seconds, value);
        } catch (error) {
            this.logger.error(
                `Failed to setex key ${key}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
        }
    }

    async del(key: string): Promise<number> {
        try {
            return await this.redis.del(key);
        } catch (error) {
            this.logger.error(
                `Failed to delete key ${key}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
        }
    }

    async exists(key: string): Promise<number> {
        try {
            return await this.redis.exists(key);
        } catch (error) {
            this.logger.error(
                `Failed to check existence of key ${key}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
        }
    }

    async expire(key: string, seconds: number): Promise<number> {
        try {
            return await this.redis.expire(key, seconds);
        } catch (error) {
            this.logger.error(
                `Failed to set expire for key ${key}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
        }
    }
}
