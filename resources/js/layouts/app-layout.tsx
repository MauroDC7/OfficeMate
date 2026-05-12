import type { PropsWithChildren } from 'react';

import { AppHeader } from '@/components/app/app-header';
import { AppSidebar } from '@/components/app/app-sidebar';

export function AppLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen bg-white">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
                <AppHeader />
                <div className="flex-1 bg-gray-50/40">{children}</div>
            </div>
        </div>
    );
}
