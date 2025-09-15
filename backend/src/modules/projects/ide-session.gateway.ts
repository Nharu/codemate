import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IdeSessionService } from './ide-session.service';
import { IdeSessionState } from './dto/ide-session.dto';
import { UsersService } from '../users/users.service';

interface JwtPayload {
    sub: string;
    email: string;
    iat?: number;
    exp?: number;
}

interface AuthenticatedSocket extends Socket {
    userId?: string;
}

@WebSocketGateway({
    namespace: '/ide-session',
})
export class IdeSessionGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(IdeSessionGateway.name);
    private readonly sessionUpdateTimeouts = new Map<string, NodeJS.Timeout>();
    private readonly DEBOUNCE_MS = 1000; // 1 second debounce

    constructor(
        private readonly jwtService: JwtService,
        private readonly ideSessionService: IdeSessionService,
        private readonly usersService: UsersService,
    ) {}

    async handleConnection(client: AuthenticatedSocket): Promise<void> {
        try {
            const token = client.handshake.auth.token as string;
            if (!token) {
                client.emit('auth:error', { message: 'No token provided' });
                client.disconnect();
                return;
            }

            const payload =
                await this.jwtService.verifyAsync<JwtPayload>(token);
            const user = await this.usersService.findById(payload.sub);

            if (!user) {
                client.emit('auth:error', { message: 'User not found' });
                client.disconnect();
                return;
            }

            client.userId = payload.sub;
            this.logger.log(
                `IDE session client connected: ${user.username} (${client.userId})`,
            );

            // Notify client that authentication is complete
            client.emit('auth:success', {
                userId: client.userId,
                username: user.username,
            });
        } catch (error) {
            this.logger.error('Authentication failed:', error);
            client.emit('auth:error', {
                message:
                    error instanceof Error
                        ? error.message
                        : 'Authentication failed',
            });
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket): void {
        if (!client.userId) return;

        // Clear any pending session updates for this user
        const timeoutKey = `${client.userId}`;
        const timeout = this.sessionUpdateTimeouts.get(timeoutKey);
        if (timeout) {
            clearTimeout(timeout);
            this.sessionUpdateTimeouts.delete(timeoutKey);
        }

        this.logger.debug(`IDE session client disconnected: ${client.userId}`);
    }

    @SubscribeMessage('session:get')
    async handleGetSession(
        @MessageBody() data: { projectId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ): Promise<void> {
        if (!client.userId) {
            client.emit('session:error', { message: 'Unauthorized' });
            return;
        }

        try {
            const session = await this.ideSessionService.getSession(
                client.userId,
                data.projectId,
            );
            client.emit('session:data', { projectId: data.projectId, session });
        } catch (error) {
            this.logger.error(
                `Failed to get session: ${error instanceof Error ? error.message : String(error)}`,
            );
            client.emit('session:error', { message: 'Failed to get session' });
        }
    }

    @SubscribeMessage('session:update')
    handleUpdateSession(
        @MessageBody() data: { projectId: string; session: IdeSessionState },
        @ConnectedSocket() client: AuthenticatedSocket,
    ): void {
        if (!client.userId) {
            client.emit('session:error', { message: 'Unauthorized' });
            return;
        }

        const timeoutKey = `${client.userId}:${data.projectId}`;
        const existingTimeout = this.sessionUpdateTimeouts.get(timeoutKey);

        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        const timeout = setTimeout(() => {
            void (async () => {
                try {
                    await this.ideSessionService.saveSession(
                        client.userId!,
                        data.projectId,
                        data.session,
                    );
                    client.emit('session:saved', { projectId: data.projectId });
                } catch (error) {
                    this.logger.error(
                        `Failed to save session: ${error instanceof Error ? error.message : String(error)}`,
                    );
                    client.emit('session:error', {
                        message: 'Failed to save session',
                    });
                } finally {
                    this.sessionUpdateTimeouts.delete(timeoutKey);
                }
            })();
        }, this.DEBOUNCE_MS);

        this.sessionUpdateTimeouts.set(timeoutKey, timeout);
    }

    @SubscribeMessage('session:extend')
    async handleExtendSession(
        @MessageBody() data: { projectId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ): Promise<void> {
        if (!client.userId) {
            client.emit('session:error', { message: 'Unauthorized' });
            return;
        }

        try {
            await this.ideSessionService.extendSession(
                client.userId,
                data.projectId,
            );
            client.emit('session:extended', { projectId: data.projectId });
        } catch (error) {
            this.logger.error(
                `Failed to extend session: ${error instanceof Error ? error.message : String(error)}`,
            );
            client.emit('session:error', {
                message: 'Failed to extend session',
            });
        }
    }

    @SubscribeMessage('session:delete')
    async handleDeleteSession(
        @MessageBody() data: { projectId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ): Promise<void> {
        if (!client.userId) {
            client.emit('session:error', { message: 'Unauthorized' });
            return;
        }

        try {
            await this.ideSessionService.deleteSession(
                client.userId,
                data.projectId,
            );
            client.emit('session:deleted', { projectId: data.projectId });
        } catch (error) {
            this.logger.error(
                `Failed to delete session: ${error instanceof Error ? error.message : String(error)}`,
            );
            client.emit('session:error', {
                message: 'Failed to delete session',
            });
        }
    }
}
