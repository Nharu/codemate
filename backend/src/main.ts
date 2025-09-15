import { NestFactory } from '@nestjs/core';
import {
    ValidationPipe,
    Logger,
    INestApplicationContext,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { Server, ServerOptions } from 'socket.io';
import { ConfigService } from '@nestjs/config';

class SocketIoAdapter extends IoAdapter {
    private readonly logger = new Logger(SocketIoAdapter.name);

    constructor(
        app: INestApplicationContext,
        private readonly configService: ConfigService,
    ) {
        super(app);
    }

    createIOServer(port: number, options?: ServerOptions): Server {
        this.logger.log(`Creating Socket.IO server on port: ${port}`);
        const server = super.createIOServer(port, {
            ...options,
            cors: {
                origin: this.configService.get<string>('FRONTEND_URL'),
                methods: ['GET', 'POST'],
                credentials: true,
            },
        }) as Server;
        this.logger.log('Socket.IO server created successfully');
        return server;
    }
}

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);

    // WebSocket adapter setup
    app.useWebSocketAdapter(new SocketIoAdapter(app, configService));

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // CORS configuration
    app.enableCors({
        origin: configService.get<string>('FRONTEND_URL'),
        credentials: true,
    });

    // Swagger documentation
    const config = new DocumentBuilder()
        .setTitle('CodeMate API')
        .setDescription('AI-powered online code collaboration platform API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = configService.get<number>('PORT') ?? 3001;
    await app.listen(port);

    const logger = new Logger('Bootstrap');
    logger.log(`Application is running on: http://localhost:${port}`);
}

void bootstrap();
