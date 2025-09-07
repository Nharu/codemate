import { Injectable, Logger } from '@nestjs/common';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly s3Client: S3Client;
    private readonly bucketName: string;

    constructor(private configService: ConfigService) {
        this.bucketName =
            this.configService.getOrThrow<string>('S3_BUCKET_NAME');

        this.s3Client = new S3Client({
            endpoint: this.configService.getOrThrow<string>('S3_ENDPOINT'),
            region: this.configService.getOrThrow<string>('AWS_REGION'),
            credentials: {
                accessKeyId:
                    this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.getOrThrow<string>(
                    'AWS_SECRET_ACCESS_KEY',
                ),
            },
            forcePathStyle: true, // Required for MinIO
        });
    }

    async uploadFile(
        file: Express.Multer.File,
        folder: string = 'uploads',
    ): Promise<string> {
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
                ContentLength: file.size,
            });

            await this.s3Client.send(command);

            // Return the public URL
            const publicUrl = `${this.configService.getOrThrow<string>('S3_PUBLIC_URL')}/${this.bucketName}/${fileName}`;

            this.logger.log(`File uploaded successfully: ${fileName}`);
            return publicUrl;
        } catch (error) {
            this.logger.error(
                `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw new Error('File upload failed');
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        try {
            // Extract the key from the URL
            const url = new URL(fileUrl);
            const pathParts = url.pathname.split('/');
            const key = pathParts.slice(2).join('/'); // Remove bucket name from path

            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            await this.s3Client.send(command);
            this.logger.log(`File deleted successfully: ${key}`);
        } catch (error) {
            this.logger.error(
                `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw new Error('File deletion failed');
        }
    }

    validateImageFile(file: Express.Multer.File): boolean {
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new Error(
                'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
            );
        }

        if (file.size > maxSize) {
            throw new Error('File too large. Maximum size is 5MB.');
        }

        return true;
    }
}
