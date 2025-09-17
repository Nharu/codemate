import { IsEnum } from 'class-validator';
import { ProjectRole } from '../project-member.entity';

export class UpdateMemberRoleDto {
    @IsEnum(ProjectRole, { message: '유효한 역할을 선택해주세요.' })
    role: ProjectRole;
}
