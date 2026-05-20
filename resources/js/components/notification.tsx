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

export type NotificationVariant = 'success' | 'error' | 'info' | 'warning';

export type NotificationInput = {
    message: string;
    title?: string;
    variant?: NotificationVariant;
    /** Extra Tailwind classes voor eigen styling. */
    className?: string;
    /** Milliseconden; standaard 5000. Zet op 0 om niet automatisch te sluiten. */
    duration?: number;
};

type NotificationItem = NotificationInput & {
    id: string;
};

type NotificationContextValue = {
    notify: (input: NotificationInput) => string;
    dismiss: (id: string) => void;
    success: (message: string, options?: Omit<NotificationInput, 'message' | 'variant'>) => string;
    error: (message: string, options?: Omit<NotificationInput, 'message' | 'variant'>) => string;
    info: (message: string, options?: Omit<NotificationInput, 'message' | 'variant'>) => string;
    warning: (message: string, options?: Omit<NotificationInput, 'message' | 'variant'>) => string;
};

const variantStyles: Record<NotificationVariant, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function NotificationToast({
    item,
    onDismiss,
}: {
    item: NotificationItem;
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
                variantStyles[variant],
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

export function NotificationProvider({ children }: PropsWithChildren) {
    const [items, setItems] = useState<NotificationItem[]>([]);

    const dismiss = useCallback((id: string) => {
        setItems((current) => current.filter((item) => item.id !== id));
    }, []);

    const notify = useCallback((input: NotificationInput): string => {
        const id = crypto.randomUUID();
        setItems((current) => [...current, { ...input, id }]);
        return id;
    }, []);

    const success = useCallback(
        (message: string, options?: Omit<NotificationInput, 'message' | 'variant'>) =>
            notify({ ...options, message, variant: 'success' }),
        [notify],
    );

    const error = useCallback(
        (message: string, options?: Omit<NotificationInput, 'message' | 'variant'>) =>
            notify({ ...options, message, variant: 'error' }),
        [notify],
    );

    const info = useCallback(
        (message: string, options?: Omit<NotificationInput, 'message' | 'variant'>) =>
            notify({ ...options, message, variant: 'info' }),
        [notify],
    );

    const warning = useCallback(
        (message: string, options?: Omit<NotificationInput, 'message' | 'variant'>) =>
            notify({ ...options, message, variant: 'warning' }),
        [notify],
    );

    const value = useMemo(
        () => ({ notify, dismiss, success, error, info, warning }),
        [notify, dismiss, success, error, info, warning],
    );

    return (
        <NotificationContext.Provider value={value}>
            {children}
            {items.length > 0 ? (
                <div
                    className="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
                    aria-live="polite"
                >
                    {items.map((item) => (
                        <NotificationToast key={item.id} item={item} onDismiss={dismiss} />
                    ))}
                </div>
            ) : null}
        </NotificationContext.Provider>
    );
}

export function useNotification(): NotificationContextValue {
    const context = useContext(NotificationContext);

    if (context === null) {
        throw new Error('useNotification moet binnen NotificationProvider gebruikt worden.');
    }

    return context;
}
