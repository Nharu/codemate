import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { ProjectRole } from '../project-member.entity';

export class AddProjectMemberDto {
    @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
    @IsNotEmpty({ message: '이메일은 필수입니다.' })
    email: string;

    @IsEnum(ProjectRole, { message: '유효한 역할을 선택해주세요.' })
    role: ProjectRole;
}
