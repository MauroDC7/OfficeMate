import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type DashboardStatCardProps = {
    label: string;
    value: ReactNode;
    detail?: string;
    href: string;
};

export function DashboardStatCard({
    label,
    value,
    detail,
    href,
}: DashboardStatCardProps) {
    return (
        <Link
            href={href}
            className={cn(
                'block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition',
                'hover:border-gray-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900',
            )}
        >
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                {value}
            </p>
            {detail !== undefined && detail !== '' ? (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {detail}
                </p>
            ) : null}
        </Link>
    );
}
