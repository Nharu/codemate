'use client';

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

const newFileSchema = z.object({
    fileName: z
        .string()
        .min(1, '파일 이름을 입력해주세요')
        .max(100, '파일 이름은 100자 이하여야 합니다')
        .regex(
            /^[^<>:"/\\|?*\x00-\x1f]+$/,
            '파일 이름에 특수문자를 사용할 수 없습니다',
        ),
    language: z.string().optional(),
});

type NewFileForm = z.infer<typeof newFileSchema>;

interface NewFileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (fileName: string, language?: string) => void;
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
}: NewFileModalProps) {
    const form = useForm<NewFileForm>({
        resolver: zodResolver(newFileSchema),
        defaultValues: {
            fileName: '',
            language: 'auto',
        },
    });

    const handleSubmit = (data: NewFileForm) => {
        const language = data.language === 'auto' ? undefined : data.language;
        onConfirm(data.fileName, language);
        form.reset({
            fileName: '',
            language: 'auto',
        });
        onOpenChange(false);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            form.reset({
                fileName: '',
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
                        새로 만들 파일의 이름과 언어를 선택하세요.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="fileName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>파일 이름</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="예: component.tsx, utils.js, README.md"
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
