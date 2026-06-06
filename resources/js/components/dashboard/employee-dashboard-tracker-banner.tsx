import { Link } from '@inertiajs/react';

import {
    dashboardSectionClassName,
    dashboardSectionLinkClassName,
} from '@/components/dashboard/dashboard-styles';
import { settings } from '@/routes';

type EmployeeDashboardTrackerBannerProps = {
    show: boolean;
};

export function EmployeeDashboardTrackerBanner({
    show,
}: EmployeeDashboardTrackerBannerProps) {
    if (!show) {
        return null;
    }

    return (
        <section className={dashboardSectionClassName}>
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                        Desktop-tracker niet gekoppeld
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Zonder tracker komen er geen automatische timesheetvoorstellen binnen.
                    </p>
                </div>
                <Link href={`${settings.url()}#tracker`} className={dashboardSectionLinkClassName}>
                    Tracker instellen
                </Link>
            </div>
        </section>
    );
}
