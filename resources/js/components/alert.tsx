import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type PropsWithChildren,
} from 'react';

import { cn } from '@/lib/utils';

export type AlertVariant = 'success' | 'error' | 'info' | 'warning';

export type AlertToastInput = {
    message: string;
    title?: string;
    variant?: AlertVariant;
    className?: string;
    duration?: number;
};

export type AlertConfirmInput = {
    message: string;
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
};

type AlertToastItem = AlertToastInput & {
    id: string;
};

type AlertContextValue = {
    notify: (input: AlertToastInput) => string;
    dismiss: (id: string) => void;
    success: (message: string, options?: Omit<AlertToastInput, 'message' | 'variant'>) => string;
    error: (message: string, options?: Omit<AlertToastInput, 'message' | 'variant'>) => string;
    info: (message: string, options?: Omit<AlertToastInput, 'message' | 'variant'>) => string;
    warning: (message: string, options?: Omit<AlertToastInput, 'message' | 'variant'>) => string;
    confirm: (input: AlertConfirmInput) => Promise<boolean>;
};

const toastVariantStyles: Record<AlertVariant, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

const AlertContext = createContext<AlertContextValue | null>(null);

function AlertToast({
    item,
    onDismiss,
}: {
    item: AlertToastItem;
    onDismiss: (id: string) => void;
}) {
    const variant = item.variant ?? 'info';
    const duration = item.duration ?? 5000;

    useEffect(() => {
        if (duration <= 0) {
            return;
        }

        const timer = window.setTimeout(() => onDismiss(item.id), duration);

        return () => window.clearTimeout(timer);
    }, [duration, item.id, onDismiss]);

    return (
        <div
            role="status"
            className={cn(
                'pointer-events-auto w-full max-w-sm rounded-lg border px-4 py-3 text-sm shadow-md',
                toastVariantStyles[variant],
                item.className,
            )}
        >
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    {item.title ? (
                        <p className="mb-0.5 font-semibold">{item.title}</p>
                    ) : null}
                    <p className={item.title ? 'text-[13px] opacity-90' : undefined}>{item.message}</p>
                </div>
                <button
                    type="button"
                    onClick={() => onDismiss(item.id)}
                    className="shrink-0 rounded p-0.5 opacity-60 transition hover:opacity-100"
                    aria-label="Sluiten"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

function AlertConfirmDialog({
    input,
    onConfirm,
    onCancel,
}: {
    input: AlertConfirmInput;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const isDanger = input.variant === 'danger';

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 p-4"
            role="presentation"
            onClick={onCancel}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
                onClick={(event) => event.stopPropagation()}
            >
                {input.title ? (
                    <h2 id="alert-dialog-title" className="text-base font-semibold text-gray-900">
                        {input.title}
                    </h2>
                ) : null}
                <p
                    id="alert-dialog-description"
                    className={cn('text-sm text-gray-600', input.title ? 'mt-2' : undefined)}
                >
                    {input.message}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        {input.cancelLabel ?? 'Annuleren'}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={cn(
                            'rounded-lg px-4 py-2 text-sm font-semibold text-white',
                            isDanger
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-gray-900 hover:bg-gray-800',
                        )}
                    >
                        {input.confirmLabel ?? 'Bevestigen'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function AlertProvider({ children }: PropsWithChildren) {
    const [toasts, setToasts] = useState<AlertToastItem[]>([]);
    const [confirmState, setConfirmState] = useState<{
        input: AlertConfirmInput;
        resolve: (value: boolean) => void;
    } | null>(null);

    const dismiss = useCallback((id: string) => {
        setToasts((current) => current.filter((item) => item.id !== id));
    }, []);

    const notify = useCallback((input: AlertToastInput): string => {
        const id = crypto.randomUUID();
        setToasts((current) => [...current, { ...input, id }]);
        return id;
    }, []);

    const success = useCallback(
        (message: string, options?: Omit<AlertToastInput, 'message' | 'variant'>) =>
            notify({ ...options, message, variant: 'success' }),
        [notify],
    );

    const error = useCallback(
        (message: string, options?: Omit<AlertToastInput, 'message' | 'variant'>) =>
            notify({ ...options, message, variant: 'error' }),
        [notify],
    );

    const info = useCallback(
        (message: string, options?: Omit<AlertToastInput, 'message' | 'variant'>) =>
            notify({ ...options, message, variant: 'info' }),
        [notify],
    );

    const warning = useCallback(
        (message: string, options?: Omit<AlertToastInput, 'message' | 'variant'>) =>
            notify({ ...options, message, variant: 'warning' }),
        [notify],
    );

    const confirm = useCallback(
        (input: AlertConfirmInput): Promise<boolean> =>
            new Promise((resolve) => {
                setConfirmState({ input, resolve });
            }),
        [],
    );

    const closeConfirm = useCallback((accepted: boolean) => {
        setConfirmState((current) => {
            current?.resolve(accepted);
            return null;
        });
    }, []);

    const value = useMemo(
        () => ({ notify, dismiss, success, error, info, warning, confirm }),
        [notify, dismiss, success, error, info, warning, confirm],
    );

    return (
        <AlertContext.Provider value={value}>
            {children}
            {toasts.length > 0 ? (
                <div
                    className="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
                    aria-live="polite"
                >
                    {toasts.map((item) => (
                        <AlertToast key={item.id} item={item} onDismiss={dismiss} />
                    ))}
                </div>
            ) : null}
            {confirmState !== null ? (
                <AlertConfirmDialog
                    input={confirmState.input}
                    onConfirm={() => closeConfirm(true)}
                    onCancel={() => closeConfirm(false)}
                />
            ) : null}
        </AlertContext.Provider>
    );
}

export function useAlert(): AlertContextValue {
    const context = useContext(AlertContext);

    if (context === null) {
        throw new Error('useAlert moet binnen AlertProvider gebruikt worden.');
    }

    return context;
}
