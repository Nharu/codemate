'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, File, Edit3, Eye, Lock, Upload } from 'lucide-react';
import { useProject } from '@/hooks/useProjects';
import {
    useProjectFiles,
    useCreateFile,
    useDeleteFile,
    useUploadZip,
    useDeleteFolder,
} from '@/hooks/useFiles';
import { File as ProjectFile } from '@/types/project';
import { useModal } from '@/hooks/useModal';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import FileTreeComponent from '@/components/ui/file-tree';
import { buildFileTree, type FileNode } from '@/lib/file-tree';
import { AlertModal } from '@/components/ui/alert-modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';

const fileSchema = z.object({
    path: z
        .string()
        .min(1, '파일 경로를 입력해주세요')
        .max(500, '파일 경로는 500자 이하여야 합니다'),
    content: z.string().min(1, '파일 내용을 입력해주세요'),
    language: z.string().optional(),
});

type FileForm = z.infer<typeof fileSchema>;

const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'yaml', label: 'YAML' },
    { value: 'markdown', label: 'Markdown' },
];

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const [isCreateFileDialogOpen, setIsCreateFileDialogOpen] = useState(false);
    const [isZipUploading, setIsZipUploading] = useState(false);
    const zipInputRef = useRef<HTMLInputElement>(null);
    const { alertState, confirmState, showConfirm, closeAlert, closeConfirm } =
        useModal();

    const {
        data: project,
        isLoading: isProjectLoading,
        error: projectError,
    } = useProject(projectId);
    const {
        data: files,
        isLoading: isFilesLoading,
        error: filesError,
    } = useProjectFiles(projectId);
    const createFileMutation = useCreateFile();
    const deleteFileMutation = useDeleteFile();
    const uploadZipMutation = useUploadZip();
    const deleteFolderMutation = useDeleteFolder();

    const form = useForm<FileForm>({
        resolver: zodResolver(fileSchema),
        defaultValues: {
            path: '',
            content: '',
            language: '',
        },
    });

    const onSubmit = async (data: FileForm) => {
        try {
            await createFileMutation.mutateAsync({ projectId, data });
            setIsCreateFileDialogOpen(false);
            form.reset();
        } catch (error) {
            console.error('파일 생성 실패:', error);
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        showConfirm(
            '정말로 이 파일을 삭제하시겠습니까?',
            async () => {
                try {
                    await deleteFileMutation.mutateAsync({ projectId, fileId });
                } catch (error) {
                    console.error('파일 삭제 실패:', error);
                    toast.error('파일 삭제 중 오류가 발생했습니다.');
                }
            },
            {
                title: '파일 삭제',
                confirmText: '삭제',
                variant: 'destructive',
            },
        );
    };

    const handleFileClick = (file: FileNode) => {
        router.push(`/dashboard/projects/${projectId}/files/${file.id}`);
    };

    const handleFileEdit = (file: FileNode) => {
        router.push(`/dashboard/projects/${projectId}/files/${file.id}/edit`);
    };

    const handleFileView = (file: FileNode) => {
        router.push(`/dashboard/projects/${projectId}/files/${file.id}`);
    };

    const handleFileDelete = (file: FileNode) => {
        handleDeleteFile(file.id);
    };

    const handleFolderDelete = async (folder: FileNode) => {
        const folderFilesCount = getAllFilesInFolder(
            files || [],
            folder.path,
        ).length;

        showConfirm(
            `"${folder.name}" 폴더와 그 안에 있는 ${folderFilesCount}개의 파일을 모두 삭제하시겠습니까?`,
            async () => {
                try {
                    await deleteFolderMutation.mutateAsync({
                        projectId,
                        folderPath: folder.path,
                    });
                    toast.success(
                        `"${folder.name}" 폴더가 성공적으로 삭제되었습니다.`,
                    );
                } catch (error) {
                    console.error('폴더 삭제 실패:', error);
                    toast.error('폴더 삭제 중 오류가 발생했습니다.');
                }
            },
            {
                title: '폴더 삭제',
                confirmText: '삭제',
                variant: 'destructive',
            },
        );
    };

    const getAllFilesInFolder = (files: ProjectFile[], folderPath: string) => {
        const normalizedFolderPath = folderPath.endsWith('/')
            ? folderPath
            : folderPath + '/';
        return files.filter((file) =>
            file.path.startsWith(normalizedFolderPath),
        );
    };

    const handleZipButtonClick = () => {
        zipInputRef.current?.click();
    };

    const handleZipUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const uploadFile = event.target.files?.[0];
        if (!uploadFile) return;

        if (!uploadFile.name.toLowerCase().endsWith('.zip')) {
            toast.error('ZIP 파일만 업로드할 수 있습니다.');
            return;
        }

        if (uploadFile.size > 50 * 1024 * 1024) {
            toast.error('파일 크기는 50MB를 초과할 수 없습니다.');
            return;
        }

        setIsZipUploading(true);
        try {
            const result = await uploadZipMutation.mutateAsync({
                projectId,
                file: uploadFile,
            });
            toast.success(
                `${result.length}개의 파일이 성공적으로 업로드되었습니다.`,
            );
        } catch (error) {
            console.error('ZIP 업로드 실패:', error);
            toast.error('ZIP 파일 업로드 중 오류가 발생했습니다.');
        } finally {
            setIsZipUploading(false);
            // Reset input
            event.target.value = '';
        }
    };

    if (projectError || filesError) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto p-6">
                    <div className="text-center text-red-500">
                        프로젝트 정보를 불러오는 중 오류가 발생했습니다.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto p-6 space-y-6">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard/projects')}
                        className="mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        프로젝트 목록으로
                    </Button>

                    {isProjectLoading ? (
                        <div>
                            <Skeleton className="h-8 w-1/3 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    ) : project ? (
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center space-x-3 mb-2">
                                    <h1 className="text-3xl font-bold">
                                        {project.name}
                                    </h1>
                                    <Badge
                                        variant={
                                            project.visibility === 'public'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {project.visibility === 'public' ? (
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
                                <p className="text-muted-foreground mb-2">
                                    {project.description ||
                                        '프로젝트 설명이 없습니다.'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    소유자: {project.owner.username} | 생성일:{' '}
                                    {new Date(
                                        project.created_at,
                                    ).toLocaleDateString()}{' '}
                                    | 수정일:{' '}
                                    {new Date(
                                        project.updated_at,
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        router.push(
                                            `/dashboard/projects/${projectId}/edit`,
                                        )
                                    }
                                >
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    편집
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-semibold">파일</h2>
                        <p className="text-muted-foreground">
                            프로젝트의 파일을 관리하세요
                        </p>
                    </div>

                    <div className="flex space-x-2">
                        {/* ZIP Upload Button */}
                        <div>
                            <input
                                ref={zipInputRef}
                                type="file"
                                accept=".zip"
                                onChange={handleZipUpload}
                                className="hidden"
                                disabled={isZipUploading}
                            />
                            <Button
                                variant="outline"
                                disabled={isZipUploading}
                                onClick={handleZipButtonClick}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {isZipUploading
                                    ? 'ZIP 업로드 중...'
                                    : 'ZIP 업로드'}
                            </Button>
                        </div>

                        {/* Create File Dialog */}
                        <Dialog
                            open={isCreateFileDialogOpen}
                            onOpenChange={setIsCreateFileDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />새 파일
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>새 파일 만들기</DialogTitle>
                                    <DialogDescription>
                                        프로젝트에 새로운 파일을 추가합니다.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(onSubmit)}
                                        className="space-y-4"
                                    >
                                        <FormField
                                            control={form.control}
                                            name="path"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        파일 경로
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="예: src/components/Button.tsx"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="language"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        프로그래밍 언어
                                                        (선택사항)
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="언어를 선택하세요" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {languageOptions.map(
                                                                (lang) => (
                                                                    <SelectItem
                                                                        key={
                                                                            lang.value
                                                                        }
                                                                        value={
                                                                            lang.value
                                                                        }
                                                                    >
                                                                        {
                                                                            lang.label
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="content"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        파일 내용
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="파일 내용을 입력하세요"
                                                            className="min-h-[200px] font-mono text-sm"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    createFileMutation.isPending
                                                }
                                            >
                                                {createFileMutation.isPending
                                                    ? '생성 중...'
                                                    : '파일 생성'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {isFilesLoading ? (
                    <Card>
                        <CardHeader>
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center space-x-3"
                                    >
                                        <Skeleton className="h-4 w-4" />
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                ))}
                            </div>
                        </CardHeader>
                    </Card>
                ) : files && files.length > 0 ? (
                    <Card>
                        <CardHeader>
                            <FileTreeComponent
                                tree={buildFileTree(
                                    files.map((file) => ({
                                        id: file.id,
                                        path: file.path,
                                        size:
                                            typeof file.size === 'string'
                                                ? parseInt(file.size, 10)
                                                : file.size,
                                        language: file.language,
                                        updated_at: file.updated_at,
                                    })),
                                )}
                                onFileClick={handleFileClick}
                                onFileEdit={handleFileEdit}
                                onFileView={handleFileView}
                                onFileDelete={handleFileDelete}
                                onFolderDelete={handleFolderDelete}
                            />
                        </CardHeader>
                    </Card>
                ) : (
                    <div className="text-center py-12">
                        <File className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                            아직 파일이 없습니다
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            첫 번째 파일을 만들어 코딩을 시작해보세요!
                        </p>
                        <Button onClick={() => setIsCreateFileDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />새 파일 만들기
                        </Button>
                    </div>
                )}

                <AlertModal
                    open={alertState.open}
                    onOpenChange={closeAlert}
                    title={alertState.title}
                    description={alertState.description}
                    confirmText={alertState.confirmText}
                />

                <ConfirmModal
                    open={confirmState.open}
                    onOpenChange={closeConfirm}
                    onConfirm={confirmState.onConfirm || (() => {})}
                    title={confirmState.title}
                    description={confirmState.description}
                    confirmText={confirmState.confirmText}
                    cancelText={confirmState.cancelText}
                    variant={confirmState.variant}
                />
            </div>
        </div>
    );
}
