'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Plus,
    Folder,
    MoreVertical,
    Trash2,
    Edit3,
    Eye,
    Lock,
} from 'lucide-react';
import {
    useProjects,
    useCreateProject,
    useDeleteProject,
} from '@/hooks/useProjects';
import { ProjectVisibility } from '@/types/project';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';

const projectSchema = z.object({
    name: z
        .string()
        .min(1, '프로젝트 이름을 입력해주세요')
        .max(100, '프로젝트 이름은 100자 이하여야 합니다'),
    description: z.string().optional(),
    visibility: z.enum([ProjectVisibility.PRIVATE, ProjectVisibility.PUBLIC]),
});

type ProjectForm = z.infer<typeof projectSchema>;

export default function ProjectsPage() {
    const router = useRouter();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const { data: projects, isLoading, error } = useProjects();
    const createProjectMutation = useCreateProject();
    const deleteProjectMutation = useDeleteProject();

    const form = useForm<ProjectForm>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: '',
            description: '',
            visibility: ProjectVisibility.PRIVATE,
        },
    });

    const onSubmit = async (data: ProjectForm) => {
        try {
            await createProjectMutation.mutateAsync(data);
            setIsCreateDialogOpen(false);
            form.reset();
        } catch (error) {
            console.error('프로젝트 생성 실패:', error);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) {
            try {
                await deleteProjectMutation.mutateAsync(projectId);
            } catch (error) {
                console.error('프로젝트 삭제 실패:', error);
            }
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto p-6">
                    <div className="text-center text-red-500">
                        프로젝트를 불러오는 중 오류가 발생했습니다.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">프로젝트</h1>
                        <p className="text-muted-foreground mt-2">
                            코드 협업을 위한 프로젝트를 관리하세요
                        </p>
                    </div>

                    <Dialog
                        open={isCreateDialogOpen}
                        onOpenChange={setIsCreateDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />새 프로젝트
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>새 프로젝트 만들기</DialogTitle>
                                <DialogDescription>
                                    새로운 코드 협업 프로젝트를 생성합니다.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    프로젝트 이름
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="예: My Awesome Project"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    설명 (선택사항)
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="프로젝트에 대한 설명을 입력하세요"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="visibility"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>공개 설정</FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="공개 설정을 선택하세요" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value={
                                                                ProjectVisibility.PRIVATE
                                                            }
                                                        >
                                                            <div className="flex items-center">
                                                                <Lock className="mr-2 h-4 w-4" />
                                                                비공개
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem
                                                            value={
                                                                ProjectVisibility.PUBLIC
                                                            }
                                                        >
                                                            <div className="flex items-center">
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                공개
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={
                                                createProjectMutation.isPending
                                            }
                                        >
                                            {createProjectMutation.isPending
                                                ? '생성 중...'
                                                : '프로젝트 생성'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Card
                                key={i}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-4 w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : projects && projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <Card
                                key={project.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() =>
                                    router.push(
                                        `/dashboard/projects/${project.id}`,
                                    )
                                }
                            >
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                                    <div className="flex items-start space-x-3 flex-1">
                                        <Folder className="h-6 w-6 text-blue-500 mt-1" />
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg font-semibold truncate">
                                                {project.name}
                                            </CardTitle>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Badge
                                                    variant={
                                                        project.visibility ===
                                                        'public'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {project.visibility ===
                                                    'public' ? (
                                                        <>
                                                            <Eye className="mr-1 h-3 w-3" />
                                                            공개
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Lock className="mr-1 h-3 w-3" />
                                                            비공개
                                                        </>
                                                    )}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            asChild
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(
                                                        `/dashboard/projects/${project.id}/edit`,
                                                    );
                                                }}
                                            >
                                                <Edit3 className="mr-2 h-4 w-4" />
                                                편집
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteProject(
                                                        project.id,
                                                    );
                                                }}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                삭제
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                                        {project.description ||
                                            '설명이 없습니다.'}
                                    </CardDescription>
                                    <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                                        <span>
                                            소유자: {project.owner.username}
                                        </span>
                                        <span>
                                            {new Date(
                                                project.updated_at,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                            아직 프로젝트가 없습니다
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            첫 번째 프로젝트를 만들어 코드 협업을 시작해보세요!
                        </p>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />새 프로젝트 만들기
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
