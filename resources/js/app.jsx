import '@vitejs/plugin-react/preamble';
import './bootstrap';
import React from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ErrorBoundary } from './Components/ErrorBoundary';
import { ToastProvider } from './Contexts/ToastContext';
import { LanguageProvider } from './Contexts/LanguageContext';

const appName = import.meta.env.VITE_APP_NAME || 'Ewan';

const initInertia = () => {
    // Try to read the initial page payload from the DOM #app element's
    // data-page attribute. Some server setups place the JSON on the
    // div instead of a <script> tag; passing it explicitly to
    // createInertiaApp prevents the runtime from receiving a null
    // initialPage and eliminates the `page.component` TypeError.
    let initialPage = null;
    try {
        const appEl = document.getElementById('app');
        // 1) Try data-page attribute
        let raw = appEl && appEl.getAttribute && appEl.getAttribute('data-page');
        if (!raw && appEl && appEl.dataset && appEl.dataset.page) raw = appEl.dataset.page;
        // 2) Some servers output the JSON inside the div as text (innerText)
        if (!raw && appEl && appEl.innerText) raw = appEl.innerText;
        // 3) As a last resort try innerHTML (may contain the JSON unescaped)
        if (!raw && appEl && appEl.innerHTML) raw = appEl.innerHTML;

        if (raw) {
            // Decode HTML entities which may be present when the attribute value
            // was HTML-escaped by the server. Create a temporary element to decode
            // safely before parsing JSON.
            const dec = document.createElement('div');
            dec.innerHTML = raw;
            const decoded = dec.textContent || dec.innerText || raw;
            initialPage = JSON.parse(decoded);
        }
    } catch (e) {
        // swallow parse errors for now; we'll produce a clearer error below
    }

    // If we still don't have an initial page, produce an explicit error and bail
    if (!initialPage) {
        const appEl = document.getElementById('app');
        console.error('[initInertia] Could not determine initial Inertia page payload.\n', {
            appElement: appEl ? appEl.outerHTML : null,
            note: 'createInertiaApp requires an initial page (page.component). Check server-side rendering or the data-page payload.'
        });
        return; // avoid calling createInertiaApp and triggering the TypeError
    }

    createInertiaApp({
        page: initialPage,
        title: (title) => `${title} - ${appName}`,
        resolve: (name) => resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx')
        ),
        setup({ el, App, props }) {
            // Debug/logging: surface the values so we can inspect why props.page
            // could be null in the wild (helps when reproducing in browser).
            try {
                console.debug('[initInertia] setup called', { el, props });
            } catch (e) {}

            // Guard against unexpected null props.page which would cause
            // Inertia to try to read `component` from null.
            if (!props || !props.page) {
                // If props.page is missing, try to read from the DOM fallback.
                const fallbackEl = document.getElementById('app');
                try {
                    console.debug('[initInertia] fallback data-page', fallbackEl && fallbackEl.getAttribute('data-page'));
                } catch (e) {}
                if (fallbackEl) {
                    // Re-run setup by returning early; Inertia will mount using el if provided.
                } else {
                    // Defer mounting until DOM is ready.
                    document.addEventListener('DOMContentLoaded', () => initInertia(), { once: true });
                    return;
                }
            }

            const mount = (mountEl) => {
                const root = createRoot(mountEl);
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
            };

            const target = el || document.getElementById('app');

            if (target) {
                mount(target);
            } else {
                // If the script runs before the DOM is parsed (scripts in <head>),
                // wait for DOMContentLoaded to ensure the #app element exists.
                document.addEventListener('DOMContentLoaded', () => {
                    const delayedTarget = document.getElementById('app');
                    if (delayedTarget) mount(delayedTarget);
                }, { once: true });
            }
        },
        progress: {
            color: '#3A86FF',
        },
    });
};

// Initialize immediately if DOM already contains the app element, otherwise
// wait for DOMContentLoaded to ensure server-rendered `#app` exists and has
// the Inertia `data-page` payload.
if (document.getElementById('app')) {
    initInertia();
} else {
    document.addEventListener('DOMContentLoaded', () => initInertia(), { once: true });
}
