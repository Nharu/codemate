import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Project } from '../../projects/project.entity';

@Entity('ai_review_records')
@Index(['userId', 'projectId', 'filePath'])
export class AiReviewRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    projectId: string;

    @Column()
    filePath: string;

    @Column('text')
    codeSnapshot: string;

    @Column('jsonb')
    reviewResult: any; // Store the complete review result

    @Column('int')
    overallScore: number;

    @Column('int')
    issueCount: number;

    @Column()
    language: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User)
    user: User;

    @ManyToOne(() => Project)
    project: Project;
}
