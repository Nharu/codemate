'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
    MoreVertical,
    Crown,
    Shield,
    User,
    Eye,
    UserMinus,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ProjectMember, ProjectRole } from '@/types/project';
import {
    useProjectMembers,
    useRemoveProjectMember,
    useUpdateMemberRole,
} from '@/hooks/useProjectMembers';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface ProjectMembersListProps {
    projectId: string;
    projectOwnerId: string;
}

const roleIcons = {
    [ProjectRole.OWNER]: Crown,
    [ProjectRole.ADMIN]: Shield,
    [ProjectRole.MEMBER]: User,
    [ProjectRole.VIEWER]: Eye,
};

const roleLabels = {
    [ProjectRole.OWNER]: '소유자',
    [ProjectRole.ADMIN]: '관리자',
    [ProjectRole.MEMBER]: '멤버',
    [ProjectRole.VIEWER]: '뷰어',
};

const roleColors = {
    [ProjectRole.OWNER]: 'bg-purple-100 text-purple-800',
    [ProjectRole.ADMIN]: 'bg-orange-100 text-orange-800',
    [ProjectRole.MEMBER]: 'bg-green-100 text-green-800',
    [ProjectRole.VIEWER]: 'bg-gray-100 text-gray-800',
};

export function ProjectMembersList({
    projectId,
    projectOwnerId,
}: ProjectMembersListProps) {
    const { data: session } = useSession();
    const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(
        null,
    );

    const { data: members, isLoading, error } = useProjectMembers(projectId);
    const removeMemberMutation = useRemoveProjectMember(projectId);
    const updateRoleMutation = useUpdateMemberRole(projectId);

    const currentUserId = session?.user?.id;
    const isOwner = currentUserId === projectOwnerId;

    const handleRemoveMember = async () => {
        if (!memberToRemove) return;

        try {
            await removeMemberMutation.mutateAsync(memberToRemove.userId);
            setMemberToRemove(null);
        } catch {
            // Error handling is done in the mutation
        }
    };

    const handleRoleChange = async (
        member: ProjectMember,
        newRole: ProjectRole,
    ) => {
        if (member.role === newRole) return;

        try {
            await updateRoleMutation.mutateAsync({
                userId: member.userId,
                data: { role: newRole },
            });
        } catch {
            // Error handling is done in the mutation
        }
    };

    const canManageMember = (member: ProjectMember) => {
        if (!isOwner) return false;
        if (member.userId === currentUserId) return false; // Can't manage self
        if (member.role === ProjectRole.OWNER) return false; // Can't manage owner
        return true;
    };

    const getAvailableRoles = () => {
        return [ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER];
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between p-4 border rounded-lg animate-pulse"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="space-y-1">
                                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                                <div className="w-32 h-3 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        <div className="w-16 h-6 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600">
                    멤버 목록을 불러오는데 실패했습니다.
                </p>
            </div>
        );
    }

    if (!members || members.length === 0) {
        return (
            <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">아직 멤버가 없습니다.</p>
                <p className="text-sm text-gray-500 mt-1">
                    첫 번째 멤버를 초대해보세요!
                </p>
            </div>
        );
    }

    // Sort members: owner first, then by role, then by name
    const sortedMembers = [...members].sort((a, b) => {
        const roleOrder = {
            [ProjectRole.OWNER]: 0,
            [ProjectRole.ADMIN]: 1,
            [ProjectRole.MEMBER]: 2,
            [ProjectRole.VIEWER]: 3,
        };

        if (a.role !== b.role) {
            return roleOrder[a.role] - roleOrder[b.role];
        }

        return a.user.username.localeCompare(b.user.username);
    });

    return (
        <>
            <div className="space-y-3">
                {sortedMembers.map((member) => {
                    const RoleIcon = roleIcons[member.role];
                    const isCurrentUser = member.userId === currentUserId;
                    const canManage = canManageMember(member);

                    return (
                        <div
                            key={member.id}
                            className={cn(
                                'flex items-center justify-between p-4 border rounded-lg',
                                isCurrentUser && 'bg-blue-50 border-blue-200',
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    {member.user.avatar_url ? (
                                        <Image
                                            src={member.user.avatar_url}
                                            alt={member.user.username}
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                    )}
                                </Avatar>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {member.user.username}
                                        </span>
                                        {isCurrentUser && (
                                            <span className="text-xs text-blue-600 font-medium">
                                                (나)
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {member.user.email}
                                    </p>
                                    {member.joinedAt && (
                                        <p className="text-xs text-gray-400">
                                            {new Date(
                                                member.joinedAt,
                                            ).toLocaleDateString('ko-KR')}
                                            에 참여
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {canManage ? (
                                    <Select
                                        value={member.role}
                                        onValueChange={(newRole: ProjectRole) =>
                                            handleRoleChange(member, newRole)
                                        }
                                        disabled={updateRoleMutation.isPending}
                                    >
                                        <SelectTrigger className="w-auto">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    roleColors[member.role]
                                                }
                                            >
                                                <RoleIcon className="h-3 w-3 mr-1" />
                                                {roleLabels[member.role]}
                                            </Badge>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getAvailableRoles().map((role) => {
                                                const Icon = roleIcons[role];
                                                return (
                                                    <SelectItem
                                                        key={role}
                                                        value={role}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="h-3 w-3" />
                                                            {roleLabels[role]}
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge
                                        variant="outline"
                                        className={roleColors[member.role]}
                                    >
                                        <RoleIcon className="h-3 w-3 mr-1" />
                                        {roleLabels[member.role]}
                                    </Badge>
                                )}

                                {canManage && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>
                                                관리
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setMemberToRemove(member)
                                                }
                                                className="text-red-600"
                                            >
                                                <UserMinus className="h-4 w-4 mr-2" />
                                                멤버 제거
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <ConfirmModal
                open={!!memberToRemove}
                onOpenChange={(open) => !open && setMemberToRemove(null)}
                onConfirm={handleRemoveMember}
                title="멤버 제거"
                description={`정말로 ${memberToRemove?.user.username}님을 프로젝트에서 제거하시겠습니까?`}
                confirmText="제거"
                cancelText="취소"
                variant="destructive"
                isLoading={removeMemberMutation.isPending}
            />
        </>
    );
}
