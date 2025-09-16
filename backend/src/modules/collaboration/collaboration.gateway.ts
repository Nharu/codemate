import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

interface ConnectedUser {
    userId: string;
    username: string;
    socketId: string;
}

interface Room {
    id: string;
    users: ConnectedUser[];
}

interface JwtPayload {
    sub: string;
    email: string;
    iat?: number;
    exp?: number;
}

interface SocketWithUser extends Socket {
    data: {
        user?: ConnectedUser;
    };
}

@WebSocketGateway({
    namespace: '/collaboration',
})
export class CollaborationGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(CollaborationGateway.name);
    private readonly rooms = new Map<string, Room>();
    private readonly userSockets = new Map<string, Socket>();

    constructor(
        private jwtService: JwtService,
        private usersService: UsersService,
    ) {}

    afterInit(_server: Server): void {
        this.logger.log('CollaborationGateway initialized');
        this.logger.log('Socket.IO server is running');
    }

    async handleConnection(client: SocketWithUser): Promise<void> {
        try {
            const token = client.handshake.auth.token as string;
            this.logger.log(
                `Connection attempt with token: ${token ? 'Token present' : 'No token'}`,
            );

            if (!token) {
                this.logger.error('No token provided');
                client.disconnect();
                return;
            }

            const payload =
                await this.jwtService.verifyAsync<JwtPayload>(token);
            this.logger.log(`Token verified for user: ${payload.sub}`);

            const userEntity = await this.usersService.findById(payload.sub);

            if (!userEntity) {
                this.logger.error(`User not found: ${payload.sub}`);
                client.disconnect();
                return;
            }

            const user: ConnectedUser = {
                userId: payload.sub,
                username: userEntity.username,
                socketId: client.id,
            };

            this.userSockets.set(payload.sub, client);
            client.data.user = user;

            this.logger.log(
                `User connected successfully: ${user.username} (${client.id})`,
            );
        } catch (error) {
            this.logger.error('Authentication failed', error);
            client.disconnect();
        }
    }

    handleDisconnect(client: SocketWithUser): void {
        const user = client.data.user;
        if (!user) return;

        this.userSockets.delete(user.userId);
        this.leaveAllRooms(client);
        this.logger.log(`User disconnected: ${user.username}`);
    }

    @SubscribeMessage('join-room')
    handleJoinRoom(
        @MessageBody() data: { roomId: string },
        @ConnectedSocket() client: SocketWithUser,
    ): { error: string } | { success: boolean; users: ConnectedUser[] } {
        const { roomId } = data;
        const user = client.data.user;

        this.logger.log(`Join room request for: ${roomId}`);

        if (!user) {
            this.logger.error('Join room failed: User not authenticated');
            return { error: 'User not authenticated' };
        }

        void client.join(roomId);

        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, { id: roomId, users: [] });
            this.logger.log(`Created new room: ${roomId}`);
        }

        const room = this.rooms.get(roomId)!;
        const existingUserIndex = room.users.findIndex(
            (u) => u.userId === user.userId,
        );

        if (existingUserIndex === -1) {
            room.users.push(user);
            this.logger.log(`Added user ${user.username} to room ${roomId}`);
        } else {
            room.users[existingUserIndex] = user;
            this.logger.log(`Updated user ${user.username} in room ${roomId}`);
        }

        this.server.to(roomId).emit('user-joined', {
            user,
            users: room.users,
        });

        this.logger.log(
            `User ${user.username} successfully joined room ${roomId} (${room.users.length} users total)`,
        );

        return { success: true, users: room.users };
    }

    @SubscribeMessage('leave-room')
    handleLeaveRoom(
        @MessageBody() data: { roomId: string },
        @ConnectedSocket() client: SocketWithUser,
    ): { error: string } | { success: boolean } {
        const { roomId } = data;
        const user = client.data.user;

        if (!user) {
            return { error: 'User not authenticated' };
        }

        void client.leave(roomId);

        const room = this.rooms.get(roomId);
        if (room) {
            room.users = room.users.filter((u) => u.userId !== user.userId);

            if (room.users.length === 0) {
                this.rooms.delete(roomId);
            } else {
                this.server.to(roomId).emit('user-left', {
                    user,
                    users: room.users,
                });
            }
        }

        this.logger.log(`User ${user.username} left room ${roomId}`);
        return { success: true };
    }

    @SubscribeMessage('cursor-move')
    handleCursorMove(
        @MessageBody()
        data: {
            roomId: string;
            position: { line: number; column: number };
            selection?: {
                startLine: number;
                startColumn: number;
                endLine: number;
                endColumn: number;
            };
        },
        @ConnectedSocket() client: SocketWithUser,
    ): { error: string } | void {
        const { roomId, position, selection } = data;
        const user = client.data.user;

        if (!user) {
            return { error: 'User not authenticated' };
        }

        client.to(roomId).emit('cursor-moved', {
            userId: user.userId,
            username: user.username,
            position,
            selection,
        });
    }

    @SubscribeMessage('text-change')
    handleTextChange(
        @MessageBody()
        data: {
            roomId: string;
            changes: Array<{
                range: {
                    startLine: number;
                    startColumn: number;
                    endLine: number;
                    endColumn: number;
                };
                text: string;
            }>;
            versionId: number;
        },
        @ConnectedSocket() client: SocketWithUser,
    ): { error: string } | void {
        const { roomId, changes, versionId } = data;
        const user = client.data.user;

        if (!user) {
            return { error: 'User not authenticated' };
        }

        client.to(roomId).emit('text-changed', {
            userId: user.userId,
            username: user.username,
            changes,
            versionId,
        });

        this.logger.debug(`Text change in room ${roomId} by ${user.username}`);
    }

    @SubscribeMessage('chat-message')
    handleChatMessage(
        @MessageBody()
        data: {
            roomId: string;
            message: string;
        },
        @ConnectedSocket() client: SocketWithUser,
    ): { error: string } | { success: boolean } {
        const { roomId, message } = data;
        const user = client.data.user;

        if (!user) {
            return { error: 'User not authenticated' };
        }

        const chatMessage = {
            id: Date.now().toString(),
            userId: user.userId,
            username: user.username,
            message: message.trim(),
            timestamp: new Date().toISOString(),
        };

        this.server.to(roomId).emit('chat-message', chatMessage);
        this.logger.debug(
            `Chat message in room ${roomId} from ${user.username}`,
        );

        return { success: true };
    }

    private leaveAllRooms(client: SocketWithUser): void {
        const user = client.data.user;
        if (!user) return;

        for (const [roomId, room] of this.rooms) {
            const userIndex = room.users.findIndex(
                (u) => u.userId === user.userId,
            );
            if (userIndex !== -1) {
                room.users.splice(userIndex, 1);
                client.to(roomId).emit('user-left', {
                    user,
                    users: room.users,
                });

                if (room.users.length === 0) {
                    this.rooms.delete(roomId);
                }
            }
        }
    }

    getRoomUsers(roomId: string): ConnectedUser[] {
        const room = this.rooms.get(roomId);
        return room ? room.users : [];
    }

    broadcastToRoom(roomId: string, event: string, data: unknown): void {
        this.server.to(roomId).emit(event, data);
    }
}
