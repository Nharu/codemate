import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from '../users/user.entity';

export enum ProjectRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    MEMBER = 'member',
    VIEWER = 'viewer',
}

@Entity('project_members')
@Unique(['projectId', 'userId']) // 한 프로젝트에 같은 사용자는 한 번만 참여 가능
export class ProjectMember {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'project_id' })
    projectId: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({
        type: 'enum',
        enum: ProjectRole,
        default: ProjectRole.MEMBER,
    })
    role: ProjectRole;

    @Column({ name: 'invited_by', nullable: true })
    invitedBy: string;

    @Column({ name: 'joined_at', type: 'timestamp', nullable: true })
    joinedAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Project, (project) => project.members, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'invited_by' })
    inviter: User;
}
