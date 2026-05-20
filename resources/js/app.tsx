import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

import { NotificationProvider } from '@/components/notification';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: {
        color: '#4B5563',
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <NotificationProvider>
                <App {...props} />
            </NotificationProvider>,
        );
    },
});
