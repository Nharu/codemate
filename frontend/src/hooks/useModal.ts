import { useState } from 'react';

interface AlertOptions {
    title?: string;
    confirmText?: string;
}

interface ConfirmOptions {
    title?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

export function useModal() {
    const [alertState, setAlertState] = useState<{
        open: boolean;
        description: string;
        title?: string;
        confirmText?: string;
    }>({
        open: false,
        description: '',
    });

    const [confirmState, setConfirmState] = useState<{
        open: boolean;
        description: string;
        title?: string;
        confirmText?: string;
        cancelText?: string;
        variant?: 'default' | 'destructive';
        onConfirm?: () => void;
    }>({
        open: false,
        description: '',
    });

    const showAlert = (description: string, options?: AlertOptions) => {
        setAlertState({
            open: true,
            description,
            title: options?.title,
            confirmText: options?.confirmText,
        });
    };

    const showConfirm = (
        description: string,
        onConfirm: () => void,
        options?: ConfirmOptions,
    ): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({
                open: true,
                description,
                title: options?.title,
                confirmText: options?.confirmText,
                cancelText: options?.cancelText,
                variant: options?.variant,
                onConfirm: () => {
                    onConfirm();
                    resolve(true);
                },
            });
        });
    };

    const closeAlert = () => {
        setAlertState((prev) => ({ ...prev, open: false }));
    };

    const closeConfirm = () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
    };

    return {
        alertState,
        confirmState,
        showAlert,
        showConfirm,
        closeAlert,
        closeConfirm,
    };
}
