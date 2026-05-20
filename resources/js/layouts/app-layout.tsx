import type { PropsWithChildren } from 'react';

import { AppHeader } from '@/components/app/app-header';
import { AppSidebar } from '@/components/app/app-sidebar';
import { FlashAlerts } from '@/components/flash-alerts';

export function AppLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex h-svh min-h-0 overflow-hidden bg-white">
            <AppSidebar />
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <AppHeader />
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain bg-gray-50/40">
                    {children}
                </div>
            </div>
            <FlashAlerts />
        </div>
    );
}
