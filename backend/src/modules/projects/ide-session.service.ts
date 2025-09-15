import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { IdeSessionState } from './dto/ide-session.dto';

@Injectable()
export class IdeSessionService {
    private readonly logger = new Logger(IdeSessionService.name);
    private readonly TTL = 7 * 24 * 60 * 60; // 7 days in seconds

    constructor(private readonly redis: RedisService) {}

    private getSessionKey(userId: string, projectId: string): string {
        return `ide_session:${userId}:${projectId}`;
    }

    async saveSession(
        userId: string,
        projectId: string,
        sessionState: IdeSessionState,
    ): Promise<void> {
        try {
            const key = this.getSessionKey(userId, projectId);
            const serializedState = JSON.stringify(sessionState);

            await this.redis.setex(key, this.TTL, serializedState);
            this.logger.debug(
                `IDE session saved for user ${userId}, project ${projectId}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to save IDE session: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
        }
    }

    async getSession(
        userId: string,
        projectId: string,
    ): Promise<IdeSessionState | null> {
        try {
            const key = this.getSessionKey(userId, projectId);
            const serializedState = await this.redis.get(key);

            if (!serializedState) {
                return null;
            }

            // Refresh TTL on access
            await this.redis.expire(key, this.TTL);

            const sessionState = JSON.parse(serializedState) as IdeSessionState;
            this.logger.debug(
                `IDE session loaded for user ${userId}, project ${projectId}`,
            );

            return sessionState;
        } catch (error) {
            this.logger.error(
                `Failed to get IDE session: ${error instanceof Error ? error.message : String(error)}`,
            );
            return null; // Return null on error to fallback to default state
        }
    }

    async deleteSession(userId: string, projectId: string): Promise<void> {
        try {
            const key = this.getSessionKey(userId, projectId);
            await this.redis.del(key);
            this.logger.debug(
                `IDE session deleted for user ${userId}, project ${projectId}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to delete IDE session: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
        }
    }

    async extendSession(userId: string, projectId: string): Promise<void> {
        try {
            const key = this.getSessionKey(userId, projectId);
            const exists = await this.redis.exists(key);

            if (exists) {
                await this.redis.expire(key, this.TTL);
                this.logger.debug(
                    `IDE session TTL extended for user ${userId}, project ${projectId}`,
                );
            }
        } catch (error) {
            this.logger.error(
                `Failed to extend IDE session TTL: ${error instanceof Error ? error.message : String(error)}`,
            );
            // Don't throw error for TTL extension failures
        }
    }
}
