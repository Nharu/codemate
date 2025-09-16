import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiReviewRecord } from './entities/ai-review-record.entity';
import { CodeReviewResponseDto } from './dto/code-review-response.dto';

@Injectable()
export class AiReviewRecordService {
    constructor(
        @InjectRepository(AiReviewRecord)
        private reviewRecordRepository: Repository<AiReviewRecord>,
    ) {}

    async saveReviewRecord(
        userId: string,
        projectId: string,
        filePath: string,
        codeSnapshot: string,
        reviewResult: CodeReviewResponseDto,
        language: string,
    ): Promise<AiReviewRecord> {
        const record = this.reviewRecordRepository.create({
            userId,
            projectId,
            filePath,
            codeSnapshot,
            reviewResult,
            overallScore: reviewResult.overallScore,
            issueCount: reviewResult.issues.length,
            language,
        });

        return this.reviewRecordRepository.save(record);
    }

    async getLatestReviewForFile(
        userId: string,
        projectId: string,
        filePath: string,
    ): Promise<AiReviewRecord | null> {
        return this.reviewRecordRepository.findOne({
            where: {
                userId,
                projectId,
                filePath,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }

    async getReviewHistoryForFile(
        userId: string,
        projectId: string,
        filePath: string,
        limit: number = 10,
    ): Promise<AiReviewRecord[]> {
        return this.reviewRecordRepository.find({
            where: {
                userId,
                projectId,
                filePath,
            },
            order: {
                createdAt: 'DESC',
            },
            take: limit,
        });
    }

    async getProjectReviewSummary(
        userId: string,
        projectId: string,
    ): Promise<{
        totalReviews: number;
        averageScore: number;
        totalIssues: number;
        recentReviews: AiReviewRecord[];
    }> {
        const [records, totalReviews] =
            await this.reviewRecordRepository.findAndCount({
                where: {
                    userId,
                    projectId,
                },
                order: {
                    createdAt: 'DESC',
                },
                take: 5,
            });

        const allRecords = await this.reviewRecordRepository.find({
            where: {
                userId,
                projectId,
            },
        });

        const averageScore =
            allRecords.length > 0
                ? allRecords.reduce(
                      (sum, record) => sum + record.overallScore,
                      0,
                  ) / allRecords.length
                : 0;

        const totalIssues = allRecords.reduce(
            (sum, record) => sum + record.issueCount,
            0,
        );

        return {
            totalReviews,
            averageScore: Math.round(averageScore),
            totalIssues,
            recentReviews: records,
        };
    }

    async deleteReviewRecord(userId: string, recordId: string): Promise<void> {
        await this.reviewRecordRepository.delete({
            id: recordId,
            userId,
        });
    }
}
