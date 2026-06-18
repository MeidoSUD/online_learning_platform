import './bootstrap';
import React from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ErrorBoundary } from './Components/ErrorBoundary';
import { ToastProvider } from './Contexts/ToastContext';
import { LanguageProvider } from './Contexts/LanguageContext';

const appName = import.meta.env.VITE_APP_NAME || 'Ewan';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(
        `./Pages/${name}.jsx`,
        import.meta.glob('./Pages/**/*.jsx')
    ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <React.StrictMode>
                <ErrorBoundary>
                    <ToastProvider>
                        <LanguageProvider>
                            <App {...props} />
                        </LanguageProvider>
                    </ToastProvider>
                </ErrorBoundary>
            </React.StrictMode>
        );
    },
    progress: {
        color: '#3A86FF',
    },
});
