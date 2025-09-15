import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';

@Entity('files')
export class File {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    project_id: string;

    @ManyToOne(() => Project, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @Column({ length: 500 })
    path: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ length: 50, nullable: true })
    language: string;

    @Column({ type: 'integer', default: 0 })
    size: number;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
