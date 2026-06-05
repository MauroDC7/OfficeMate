import type { ReactNode } from 'react';

import { AppFooter } from '@/components/app/app-footer';
import { FlashAlerts } from '@/components/flash-alerts';

export const authInputClassName =
    'mt-2 block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-red-500/55 focus:ring-2 focus:ring-red-500/15';

export const authLabelClassName =
    'block text-xs font-semibold tracking-wide text-gray-500 uppercase';

export const authErrorClassName = 'mt-2 text-xs font-medium text-red-600';

export const authSubmitClassName =
    'mt-2 flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 enabled:active:bg-red-800 disabled:pointer-events-none disabled:opacity-60';

type AuthFieldProps = {
    id: string;
    name?: string;
    label: string;
    type: 'text' | 'email' | 'password';
    autoComplete: string;
    placeholder: string;
    error?: string;
    onChange?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    describedBy?: string;
};

export function AuthField({
    id,
    name = id,
    label,
    type,
    autoComplete,
    placeholder,
    error,
    onChange,
    onFocus,
    onBlur,
    describedBy,
}: AuthFieldProps): ReactNode {
    return (
        <div>
            <label htmlFor={id} className={authLabelClassName}>
                {label}
            </label>
            <input
                id={id}
                name={name}
                type={type}
                autoComplete={autoComplete}
                required
                placeholder={placeholder}
                className={authInputClassName}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={
                    [describedBy, error ? `${id}-error` : null].filter(Boolean).join(' ') ||
                    undefined
                }
                onChange={
                    onChange
                        ? (event) => {
                              onChange(event.target.value);
                          }
                        : undefined
                }
                onFocus={onFocus}
                onBlur={onBlur}
            />
            {error ? (
                <p id={`${id}-error`} className={authErrorClassName} role="alert">
                    {error}
                </p>
            ) : null}
        </div>
    );
}

type AuthPageProps = {
    title: string;
    subtitle: string;
    headerExtra?: ReactNode;
    children: ReactNode;
};

export function AuthPage({ title, subtitle, headerExtra, children }: AuthPageProps): ReactNode {
    return (
        <div className="relative flex min-h-svh flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(220,38,38,0.06),transparent)]"
            />

            <div className="relative flex flex-1 items-center justify-center px-4 py-8 sm:py-16">
                <div className="w-full max-w-[400px]">
                    <header className="mb-6 flex flex-col items-center text-center sm:mb-10">
                        <img
                            src="/img/logoTransparent.png"
                            alt="TimeTraq"
                            className="mb-4 size-14 object-contain sm:size-16"
                            width={64}
                            height={64}
                            decoding="async"
                            draggable={false}
                        />
                        <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                            {title}
                        </h1>
                        <p className="mt-2 text-sm leading-relaxed text-gray-500">{subtitle}</p>
                        {headerExtra !== undefined ? (
                            <div className="mt-3">{headerExtra}</div>
                        ) : null}
                    </header>

                    <div className="rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/60 ring-1 ring-gray-950/5">
                        {children}
                    </div>
                </div>
            </div>

            <AppFooter />
            <FlashAlerts />
        </div>
    );
}
