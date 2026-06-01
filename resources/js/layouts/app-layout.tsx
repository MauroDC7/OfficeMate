import { usePage } from '@inertiajs/react';
import { useEffect, useState, type PropsWithChildren } from 'react';

import { AppHeader } from '@/components/app/app-header';
import { AppSidebar } from '@/components/app/app-sidebar';
import { ChatbotWidget } from '@/components/chatbot/chatbot-widget';
import { FlashAlerts } from '@/components/flash-alerts';

export function AppLayout({ children }: PropsWithChildren) {
    const pageUrl = usePage().url;
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setSidebarOpen(false);
    }, [pageUrl]);

    useEffect(() => {
        if (!isSidebarOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isSidebarOpen]);

    return (
        <div className="flex h-svh min-h-0 overflow-hidden bg-white">
            <AppSidebar
                isMobileOpen={isSidebarOpen}
                onCloseMobile={() => setSidebarOpen(false)}
            />
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <AppHeader onOpenMobileSidebar={() => setSidebarOpen(true)} />
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain bg-gray-50/40">
                    {children}
                </div>
            </div>
            <FlashAlerts />
            <ChatbotWidget />
        </div>
    );
}
