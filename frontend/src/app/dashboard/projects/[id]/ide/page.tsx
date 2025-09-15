'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Code } from 'lucide-react';
import { useProject } from '@/hooks/useProjects';
import {
    useProjectFiles,
    useCreateFile,
    useUpdateFile,
    useDeleteFile,
    useDeleteFolder,
} from '@/hooks/useFiles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import WebIDE from '@/components/ide/WebIDE';
import { toast } from 'sonner';

export default function ProjectIDEPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

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
    const updateFileMutation = useUpdateFile();
    const deleteFileMutation = useDeleteFile();
    const deleteFolderMutation = useDeleteFolder();

    const handleFileCreate = async (
        path: string,
        content: string,
        language?: string,
    ) => {
        try {
            const createdFile = await createFileMutation.mutateAsync({
                projectId,
                data: { path, content, language },
            });
            toast.success('파일이 생성되었습니다.');
            return createdFile;
        } catch (error) {
            console.error('파일 생성 실패:', error);
            toast.error('파일 생성 중 오류가 발생했습니다.');
            throw error;
        }
    };

    const handleFileUpdate = async (fileId: string, content: string) => {
        try {
            await updateFileMutation.mutateAsync({
                projectId,
                fileId,
                data: { content },
            });
            toast.success('파일이 저장되었습니다.');
        } catch (error) {
            console.error('파일 업데이트 실패:', error);
            toast.error('파일 저장 중 오류가 발생했습니다.');
            throw error;
        }
    };

    const handleFileDelete = async (fileId: string) => {
        try {
            await deleteFileMutation.mutateAsync({ projectId, fileId });
            toast.success('파일이 삭제되었습니다.');
        } catch (error) {
            console.error('파일 삭제 실패:', error);
            toast.error('파일 삭제 중 오류가 발생했습니다.');
            throw error;
        }
    };

    const handleFolderDelete = async (folderPath: string) => {
        try {
            await deleteFolderMutation.mutateAsync({ projectId, folderPath });
            toast.success('폴더가 삭제되었습니다.');
        } catch (error) {
            console.error('폴더 삭제 실패:', error);
            toast.error('폴더 삭제 중 오류가 발생했습니다.');
            throw error;
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

    if (isProjectLoading || isFilesLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto p-6">
                    <div className="mb-4">
                        <Skeleton className="h-8 w-32 mb-2" />
                        <Skeleton className="h-6 w-64" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            <Header />

            {/* Project Header */}
            <div className="bg-white border-b p-4 flex-shrink-0">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            onClick={() =>
                                router.push(`/dashboard/projects/${projectId}`)
                            }
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            프로젝트로 돌아가기
                        </Button>

                        {project && (
                            <div className="flex items-center space-x-3">
                                <Code className="h-6 w-6" />
                                <h1 className="text-xl font-semibold">
                                    {project.name}
                                </h1>
                                <Badge variant="outline">IDE</Badge>
                            </div>
                        )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                        Ctrl+S로 저장 | VS Code 단축키 지원
                    </div>
                </div>
            </div>

            {/* IDE Container */}
            <div className="flex-1 overflow-hidden">
                {files ? (
                    <WebIDE
                        projectId={projectId}
                        files={files}
                        onFileCreate={handleFileCreate}
                        onFileUpdate={handleFileUpdate}
                        onFileDelete={handleFileDelete}
                        onFolderDelete={handleFolderDelete}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <Code className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-500">
                                파일을 불러오는 중...
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
