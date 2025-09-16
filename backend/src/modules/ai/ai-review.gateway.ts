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
import { AiService } from './ai.service';
import {
    CodeReviewRequestDto,
    SupportedLanguage,
} from './dto/code-review-request.dto';
import { UsersService } from '../users/users.service';
import { AiReviewRecordService } from './ai-review-record.service';

interface JwtPayload {
    sub: string;
    email: string;
    iat?: number;
    exp?: number;
}

interface AuthenticatedSocket extends Socket {
    userId?: string;
}

interface AiReviewRequest {
    requestId: string;
    projectId: string;
    code: string;
    language: string;
    filePath?: string;
    context?: string;
}

@WebSocketGateway({
    namespace: '/ai-review',
})
export class AiReviewGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(AiReviewGateway.name);
    private readonly activeReviews = new Map<string, boolean>(); // requestId -> isActive

    constructor(
        private readonly jwtService: JwtService,
        private readonly aiService: AiService,
        private readonly usersService: UsersService,
        private readonly reviewRecordService: AiReviewRecordService,
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
                `AI Review client connected: ${user.username} (${client.userId})`,
            );

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

        // Cancel any active reviews for this client
        for (const [requestId, isActive] of this.activeReviews.entries()) {
            if (isActive && requestId.startsWith(client.userId)) {
                this.activeReviews.set(requestId, false);
            }
        }

        this.logger.debug(`AI Review client disconnected: ${client.userId}`);
    }

    @SubscribeMessage('review:start')
    async handleStartReview(
        @MessageBody() data: AiReviewRequest,
        @ConnectedSocket() client: AuthenticatedSocket,
    ): Promise<void> {
        if (!client.userId) {
            client.emit('review:error', {
                requestId: data.requestId,
                message: 'Unauthorized',
            });
            return;
        }

        const requestKey = `${client.userId}:${data.requestId}`;
        this.activeReviews.set(requestKey, true);

        try {
            // Emit progress updates
            client.emit('review:progress', {
                requestId: data.requestId,
                stage: 'initializing',
                message: '코드 분석을 시작합니다...',
                progress: 10,
            });

            // Check if request was cancelled
            if (!this.activeReviews.get(requestKey)) {
                client.emit('review:cancelled', {
                    requestId: data.requestId,
                });
                return;
            }

            client.emit('review:progress', {
                requestId: data.requestId,
                stage: 'analyzing',
                message: 'AI가 코드를 분석하고 있습니다...',
                progress: 30,
            });

            // Perform the AI review - map language string to enum
            const languageMap: Record<string, SupportedLanguage> = {
                typescript: SupportedLanguage.TYPESCRIPT,
                javascript: SupportedLanguage.JAVASCRIPT,
                python: SupportedLanguage.PYTHON,
                java: SupportedLanguage.JAVA,
                cpp: SupportedLanguage.CPP,
                'c++': SupportedLanguage.CPP,
                csharp: SupportedLanguage.CSHARP,
                'c#': SupportedLanguage.CSHARP,
                go: SupportedLanguage.GO,
                rust: SupportedLanguage.RUST,
            };

            const mappedLanguage =
                languageMap[data.language.toLowerCase()] ||
                SupportedLanguage.TYPESCRIPT;

            const reviewRequest: CodeReviewRequestDto = {
                code: data.code,
                language: mappedLanguage,
                filePath: data.filePath,
                context: data.context,
            };

            const result = await this.aiService.reviewCode(reviewRequest);

            // Check if request was cancelled during processing
            if (!this.activeReviews.get(requestKey)) {
                client.emit('review:cancelled', {
                    requestId: data.requestId,
                });
                return;
            }

            client.emit('review:progress', {
                requestId: data.requestId,
                stage: 'finalizing',
                message: '분석 결과를 정리하고 있습니다...',
                progress: 90,
            });

            // Small delay to show finalizing stage
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Save review record to database
            try {
                await this.reviewRecordService.saveReviewRecord(
                    client.userId,
                    data.projectId,
                    data.filePath || 'untitled',
                    data.code,
                    result,
                    data.language,
                );
            } catch (saveError) {
                this.logger.warn(
                    `Failed to save review record: ${saveError instanceof Error ? saveError.message : String(saveError)}`,
                );
                // Don't fail the review if saving fails
            }

            // Send final result
            client.emit('review:completed', {
                requestId: data.requestId,
                result,
                progress: 100,
            });

            this.logger.log(
                `AI Review completed for user ${client.userId}, request ${data.requestId}`,
            );
        } catch (error) {
            this.logger.error('AI Review failed:', error);
            client.emit('review:error', {
                requestId: data.requestId,
                message:
                    error instanceof Error ? error.message : 'AI Review failed',
            });
        } finally {
            this.activeReviews.delete(requestKey);
        }
    }

    @SubscribeMessage('review:cancel')
    handleCancelReview(
        @MessageBody() data: { requestId: string },
        @ConnectedSocket() client: AuthenticatedSocket,
    ): void {
        if (!client.userId) {
            return;
        }

        const requestKey = `${client.userId}:${data.requestId}`;
        this.activeReviews.set(requestKey, false);

        client.emit('review:cancelled', {
            requestId: data.requestId,
        });

        this.logger.log(
            `AI Review cancelled for user ${client.userId}, request ${data.requestId}`,
        );
    }
}
