'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const createNewFileSchema = (existingPaths: string[] = []) =>
    z.object({
        filePath: z
            .string()
            .min(1, '파일 경로를 입력해주세요')
            .max(255, '파일 경로는 255자 이하여야 합니다')
            .regex(
                /^[^<>:"|?*\x00-\x1f]+$/,
                '파일 경로에 사용할 수 없는 특수문자가 있습니다',
            )
            .refine((path) => {
                // 파일명이 비어있으면 안됨
                const fileName = path.split('/').pop();
                return fileName && fileName.trim().length > 0;
            }, '파일명을 입력해주세요')
            .refine((path) => {
                // 중복 경로 체크
                return !existingPaths.includes(path);
            }, '이미 존재하는 파일입니다. 다른 파일명을 사용해주세요.'),
        language: z.string().optional(),
    });

type NewFileForm = z.infer<ReturnType<typeof createNewFileSchema>>;

interface NewFileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (filePath: string, language?: string) => void;
    initialPath?: string; // 선택된 폴더 경로가 있으면 초기값으로 설정
    existingPaths?: string[]; // 기존 파일 경로들
}

const languageOptions = [
    { value: 'auto', label: '자동 감지' },
    { value: 'javascript', label: 'JavaScript (.js)' },
    { value: 'typescript', label: 'TypeScript (.ts)' },
    { value: 'python', label: 'Python (.py)' },
    { value: 'java', label: 'Java (.java)' },
    { value: 'cpp', label: 'C++ (.cpp)' },
    { value: 'c', label: 'C (.c)' },
    { value: 'go', label: 'Go (.go)' },
    { value: 'rust', label: 'Rust (.rs)' },
    { value: 'php', label: 'PHP (.php)' },
    { value: 'ruby', label: 'Ruby (.rb)' },
    { value: 'swift', label: 'Swift (.swift)' },
    { value: 'kotlin', label: 'Kotlin (.kt)' },
    { value: 'html', label: 'HTML (.html)' },
    { value: 'css', label: 'CSS (.css)' },
    { value: 'scss', label: 'SCSS (.scss)' },
    { value: 'json', label: 'JSON (.json)' },
    { value: 'yaml', label: 'YAML (.yaml)' },
    { value: 'markdown', label: 'Markdown (.md)' },
    { value: 'plaintext', label: 'Text (.txt)' },
];

export function NewFileModal({
    open,
    onOpenChange,
    onConfirm,
    initialPath = '',
    existingPaths = [],
}: NewFileModalProps) {
    const schema = useMemo(
        () => createNewFileSchema(existingPaths),
        [existingPaths],
    );

    const form = useForm<NewFileForm>({
        resolver: zodResolver(schema),
        defaultValues: {
            filePath: initialPath,
            language: 'auto',
        },
        mode: 'onChange', // 값이 변경될 때마다 유효성 검사 수행
    });

    // 모달이 열릴 때마다 폼 초기화
    useEffect(() => {
        if (open) {
            form.reset({
                filePath: initialPath,
                language: 'auto',
            });
        }
    }, [open, initialPath, form]);

    const handleSubmit = (data: NewFileForm) => {
        const language = data.language === 'auto' ? undefined : data.language;
        onConfirm(data.filePath, language);
        form.reset({
            filePath: '',
            language: 'auto',
        });
        onOpenChange(false);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            form.reset({
                filePath: '',
                language: 'auto',
            });
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>새 파일 만들기</DialogTitle>
                    <DialogDescription>
                        새로 만들 파일의 경로와 언어를 선택하세요. 폴더가 없으면
                        자동으로 생성됩니다.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="filePath"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>파일 경로</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="예: src/components/Button.tsx, utils/helpers.js, docs/README.md"
                                            {...field}
                                            autoFocus
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
                                    <FormLabel>언어 (선택사항)</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="파일 확장자로 자동 감지" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {languageOptions.map((lang) => (
                                                <SelectItem
                                                    key={lang.value}
                                                    value={lang.value}
                                                >
                                                    {lang.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                취소
                            </Button>
                            <Button type="submit">파일 만들기</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
