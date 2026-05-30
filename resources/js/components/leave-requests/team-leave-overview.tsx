import { formatLeavePeriod } from '@/components/leave-requests/leave-request-helpers';
import type { TeamLeaveItem } from '@/types/leave-requests';

type TeamLeaveOverviewProps = {
    title: string;
    description: string;
    items: TeamLeaveItem[];
    emptyMessage: string;
    noOrganizationMessage?: string;
    hasOrganization: boolean;
};

export function TeamLeaveOverview({
    title,
    description,
    items,
    emptyMessage,
    noOrganizationMessage = 'Koppel aan een organisatie om verlof van collega’s te zien.',
    hasOrganization,
}: TeamLeaveOverviewProps) {
    return (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                <p className="mt-0.5 text-xs text-gray-500">{description}</p>
            </div>

            {!hasOrganization ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500 sm:px-5">
                    {noOrganizationMessage}
                </p>
            ) : items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500 sm:px-5">
                    {emptyMessage}
                </p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-900">
                                    {item.user.name}
                                </p>
                                <p className="truncate text-xs text-gray-500">{item.type_label}</p>
                            </div>
                            <p className="shrink-0 text-xs font-medium text-gray-600">
                                {formatLeavePeriod(item)}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
