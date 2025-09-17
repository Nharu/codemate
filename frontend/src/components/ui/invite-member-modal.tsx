'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProjectRole } from '@/types/project';
import { useAddProjectMember } from '@/hooks/useProjectMembers';
import { Mail, UserPlus } from 'lucide-react';

const formSchema = z.object({
    email: z
        .string()
        .min(1, { message: '이메일을 입력해주세요.' })
        .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
            message: '유효한 이메일 주소를 입력해주세요.',
        }),
    role: z.enum([ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER], {
        message: '역할을 선택해주세요.',
    }),
});

type FormData = z.infer<typeof formSchema>;

interface InviteMemberModalProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
}

const roleLabels = {
    [ProjectRole.OWNER]: '소유자',
    [ProjectRole.ADMIN]: '관리자',
    [ProjectRole.MEMBER]: '멤버',
    [ProjectRole.VIEWER]: '뷰어',
};

const roleDescriptions = {
    [ProjectRole.OWNER]: '프로젝트의 모든 권한을 가집니다',
    [ProjectRole.ADMIN]: '프로젝트를 관리하고 멤버를 초대할 수 있습니다',
    [ProjectRole.MEMBER]: '파일을 편집하고 협업할 수 있습니다',
    [ProjectRole.VIEWER]: '프로젝트를 보기만 할 수 있습니다',
};

const roleColors = {
    [ProjectRole.OWNER]: 'bg-purple-100 text-purple-800',
    [ProjectRole.ADMIN]: 'bg-orange-100 text-orange-800',
    [ProjectRole.MEMBER]: 'bg-green-100 text-green-800',
    [ProjectRole.VIEWER]: 'bg-gray-100 text-gray-800',
};

export function InviteMemberModal({
    projectId,
    isOpen,
    onClose,
}: InviteMemberModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const addMemberMutation = useAddProjectMember(projectId);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            role: ProjectRole.MEMBER,
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            await addMemberMutation.mutateAsync(data);
            form.reset();
            onClose();
        } catch {
            // Error handling is done in the mutation
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        form.reset();
        onClose();
    };

    const selectedRole = form.watch('role');

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        프로젝트 멤버 초대
                    </DialogTitle>
                    <DialogDescription>
                        이메일 주소로 새로운 멤버를 초대하고 역할을 설정하세요.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>이메일 주소</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                {...field}
                                                type="email"
                                                placeholder="user@example.com"
                                                className="pl-10"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>역할</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isSubmitting}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="역할을 선택하세요" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(roleLabels).map(
                                                ([role, label]) => (
                                                    <SelectItem
                                                        key={role}
                                                        value={role}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    roleColors[
                                                                        role as ProjectRole
                                                                    ]
                                                                }
                                                            >
                                                                {label}
                                                            </Badge>
                                                        </div>
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedRole && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className={roleColors[selectedRole]}>
                                        {roleLabels[selectedRole]}
                                    </Badge>
                                    <span className="text-sm font-medium">
                                        권한 설명
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {roleDescriptions[selectedRole]}
                                </p>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isSubmitting ? '초대 중...' : '초대 보내기'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
