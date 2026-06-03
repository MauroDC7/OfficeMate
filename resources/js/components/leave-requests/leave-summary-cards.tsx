import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { LeaveRequestBalance } from '@/types/leave-requests';

type LeaveSummaryCardsProps = {
    balance: LeaveRequestBalance;
    pendingCount: number;
    lastPendingPeriod: string | null;
    upcomingCount: number;
    nextUpcomingInDays: number | null;
};

function CardShell({
    label,
    icon,
    children,
}: {
    label: string;
    icon?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
                {icon}
            </div>
            {children}
        </div>
    );
}

function IconBubble({ tone, children }: { tone: string; children: ReactNode }) {
    return (
        <span
            className={cn(
                'inline-flex size-8 shrink-0 items-center justify-center rounded-full',
                tone,
            )}
        >
            {children}
        </span>
    );
}

function upcomingDetail(days: number | null): string {
    if (days === null) {
        return 'Geen geplande periodes';
    }

    if (days <= 0) {
        return 'Start vandaag';
    }

    if (days === 1) {
        return 'Start morgen';
    }

    return `Start over ${days} dagen`;
}

export function LeaveSummaryCards({
    balance,
    pendingCount,
    lastPendingPeriod,
    upcomingCount,
    nextUpcomingInDays,
}: LeaveSummaryCardsProps) {
    const usedPercent =
        balance.annual_days > 0
            ? Math.min(100, Math.round((balance.used_days / balance.annual_days) * 100))
            : 0;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CardShell label="Vrije dagen">
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-tight text-gray-900">
                        {balance.remaining_days}
                    </span>
                    <span className="text-sm text-gray-500">van {balance.annual_days} dagen</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                        className="h-full rounded-full bg-red-500 transition-all"
                        style={{ width: `${usedPercent}%` }}
                    />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    {balance.used_days} gebruikt · {balance.pending_days} in behandeling
                </p>
            </CardShell>

            <CardShell
                label="In behandeling"
                icon={
                    <IconBubble tone="bg-gray-50 text-amber-600">
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.8} />
                            <path
                                d="M12 7.5V12l3 2"
                                stroke="currentColor"
                                strokeWidth={1.8}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </IconBubble>
                }
            >
                <span className="mt-2 block text-3xl font-semibold tracking-tight text-gray-900">
                    {pendingCount}
                </span>
                <p className="mt-1 text-xs text-gray-500">
                    {lastPendingPeriod !== null
                        ? `Laatste: ${lastPendingPeriod}`
                        : 'Geen aanvragen in behandeling'}
                </p>
            </CardShell>

            <CardShell
                label="Komend verlof"
                icon={
                    <IconBubble tone="bg-gray-50 text-sky-600">
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
                            <rect
                                x="3.5"
                                y="4.5"
                                width="17"
                                height="16"
                                rx="2.5"
                                stroke="currentColor"
                                strokeWidth={1.8}
                            />
                            <path
                                d="M3.5 9h17M8 3v3M16 3v3"
                                stroke="currentColor"
                                strokeWidth={1.8}
                                strokeLinecap="round"
                            />
                        </svg>
                    </IconBubble>
                }
            >
                <span className="mt-2 block text-3xl font-semibold tracking-tight text-gray-900">
                    {upcomingCount}
                </span>
                <p className="mt-1 text-xs text-gray-500">{upcomingDetail(nextUpcomingInDays)}</p>
            </CardShell>
        </div>
    );
}
