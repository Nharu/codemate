import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember, ProjectRole } from './project-member.entity';
import { Project } from './project.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProjectMemberService {
    constructor(
        @InjectRepository(ProjectMember)
        private projectMemberRepository: Repository<ProjectMember>,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        private usersService: UsersService,
    ) {}

    async addMember(
        projectId: string,
        userEmail: string,
        role: ProjectRole,
        invitedById: string,
    ): Promise<ProjectMember> {
        // 프로젝트 존재 확인
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ['owner'],
        });

        if (!project) {
            throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
        }

        // 초대하는 사용자가 프로젝트 소유자 또는 관리자인지 확인
        const inviter = await this.canManageMembers(projectId, invitedById);
        if (!inviter) {
            throw new ForbiddenException('멤버를 추가할 권한이 없습니다.');
        }

        // 초대할 사용자 찾기
        const user = await this.usersService.findByEmail(userEmail);
        if (!user) {
            throw new NotFoundException('사용자를 찾을 수 없습니다.');
        }

        // 이미 멤버인지 확인
        const existingMember = await this.projectMemberRepository.findOne({
            where: { projectId, userId: user.id },
        });

        if (existingMember) {
            throw new BadRequestException('이미 프로젝트 멤버입니다.');
        }

        // 프로젝트 소유자는 멤버로 추가할 수 없음
        if (project.owner_id === user.id) {
            throw new BadRequestException(
                '프로젝트 소유자는 멤버로 추가할 수 없습니다.',
            );
        }

        // 멤버 추가
        const member = this.projectMemberRepository.create({
            projectId,
            userId: user.id,
            role,
            invitedBy: invitedById,
            joinedAt: new Date(),
        });

        return await this.projectMemberRepository.save(member);
    }

    async removeMember(
        projectId: string,
        userId: string,
        removedById: string,
    ): Promise<void> {
        // 권한 확인
        const canManage = await this.canManageMembers(projectId, removedById);
        if (!canManage) {
            throw new ForbiddenException('멤버를 제거할 권한이 없습니다.');
        }

        // 멤버 찾기
        const member = await this.projectMemberRepository.findOne({
            where: { projectId, userId },
        });

        if (!member) {
            throw new NotFoundException('멤버를 찾을 수 없습니다.');
        }

        await this.projectMemberRepository.remove(member);
    }

    async updateMemberRole(
        projectId: string,
        userId: string,
        newRole: ProjectRole,
        updatedById: string,
    ): Promise<ProjectMember> {
        // 권한 확인 (소유자만 역할 변경 가능)
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });

        if (!project || project.owner_id !== updatedById) {
            throw new ForbiddenException('역할을 변경할 권한이 없습니다.');
        }

        const member = await this.projectMemberRepository.findOne({
            where: { projectId, userId },
        });

        if (!member) {
            throw new NotFoundException('멤버를 찾을 수 없습니다.');
        }

        member.role = newRole;
        return await this.projectMemberRepository.save(member);
    }

    async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
        return await this.projectMemberRepository.find({
            where: { projectId },
            relations: ['user'],
            order: { createdAt: 'ASC' },
        });
    }

    async getUserProjects(userId: string): Promise<Project[]> {
        const members = await this.projectMemberRepository.find({
            where: { userId },
            relations: ['project', 'project.owner'],
            order: { createdAt: 'DESC' },
        });

        return members.map((member) => member.project);
    }

    async hasProjectAccess(
        projectId: string,
        userId: string,
    ): Promise<boolean> {
        // 프로젝트 소유자인지 확인
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });

        if (project?.owner_id === userId) {
            return true;
        }

        // 프로젝트 멤버인지 확인
        const member = await this.projectMemberRepository.findOne({
            where: { projectId, userId },
        });

        return !!member;
    }

    async getUserRoleInProject(
        projectId: string,
        userId: string,
    ): Promise<ProjectRole | null> {
        // 프로젝트 소유자인지 확인
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });

        if (project?.owner_id === userId) {
            return ProjectRole.OWNER;
        }

        // 멤버 역할 확인
        const member = await this.projectMemberRepository.findOne({
            where: { projectId, userId },
        });

        return member?.role || null;
    }

    private async canManageMembers(
        projectId: string,
        userId: string,
    ): Promise<boolean> {
        const role = await this.getUserRoleInProject(projectId, userId);
        return role === ProjectRole.OWNER || role === ProjectRole.ADMIN;
    }

    async ensureOwnerMembership(
        projectId: string,
        ownerId: string,
    ): Promise<void> {
        // Check if owner already has a membership record
        const existingMembership = await this.projectMemberRepository.findOne({
            where: { projectId, userId: ownerId },
        });

        if (!existingMembership) {
            // Create OWNER membership record
            const ownerMember = this.projectMemberRepository.create({
                projectId,
                userId: ownerId,
                role: ProjectRole.OWNER,
                invitedBy: ownerId, // Owner invited themselves
                joinedAt: new Date().toISOString(),
            });

            await this.projectMemberRepository.save(ownerMember);
        }
    }
}
