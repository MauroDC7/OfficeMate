import { cn } from '@/lib/utils';
import type { LeaveRequestBalance } from '@/types/leave-requests';

type LeaveRequestBalanceCardProps = {
    balance: LeaveRequestBalance;
};

export function LeaveRequestBalanceCard({ balance }: LeaveRequestBalanceCardProps) {
    const usedPercent =
        balance.annual_days > 0
            ? Math.min(100, Math.round((balance.used_days / balance.annual_days) * 100))
            : 0;

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                    Verlofsaldo {balance.year}
                </h2>
                <p className="text-xs text-gray-500">Vakantie en persoonlijk verlof</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                    <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                        Jaarrecht
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{balance.annual_days}</p>
                </div>
                <div>
                    <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                        Gebruikt
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{balance.used_days}</p>
                </div>
                <div>
                    <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                        In behandeling
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                        {balance.pending_days}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                        Resterend
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                        {balance.remaining_days}
                    </p>
                </div>
            </div>

            {balance.annual_days > 0 ? (
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Verbruik</span>
                        <span>
                            {balance.used_days} / {balance.annual_days} dagen
                        </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all',
                                usedPercent >= 90 ? 'bg-amber-500' : 'bg-emerald-500',
                            )}
                            style={{ width: `${usedPercent}%` }}
                        />
                    </div>
                </div>
            ) : null}
        </section>
    );
}
