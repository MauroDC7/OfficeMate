import type { Auth } from '@/types/auth';
import type { BroadcastingConfig } from '@/lib/echo';
import type { DashboardNotification } from '@/types/dashboard';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            broadcasting: BroadcastingConfig | null;
            recentNotifications: DashboardNotification[];
            [key: string]: unknown;
        };
    }
}
