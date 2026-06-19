<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Ewan') }}</title>

    {{-- Inertia head (title/meta injected by pages) --}}
    @inertiaHead

    {{-- Vite assets (build or dev) --}}
    @if (app()->environment('local'))
        @vite(['resources/js/app.jsx'])
    @else
        {{-- When using built assets, laravel-vite-plugin will generate the correct tags into public/build --}}
        @vite(['resources/js/app.jsx'])
    @endif
</head>
<body>
    {{-- Inertia root element --}}
    @inertia
    {{-- Shim: if the server rendered the page JSON into the div's data-page (HTML-escaped),
         create a <script type="application/json" data-page="app"> so the Inertia runtime
         can reliably read the payload. This avoids client-side parsing issues. --}}
    <script>
        (function(){
            try {
                var appEl = document.getElementById('app');
                if (!appEl) return;
                // Only add the script tag if one doesn't already exist.
                if (document.querySelector('script[data-page="app"][type="application/json"]')) return;
                var raw = appEl.getAttribute && appEl.getAttribute('data-page');
                if (!raw && appEl.innerText) raw = appEl.innerText;
                var s = document.createElement('script');
                s.type = 'application/json';
                s.setAttribute('data-page', 'app');
                s.textContent = raw || '';
                document.head.appendChild(s);
            } catch (e) {
                // no-op
            }
        })();
    </script>
</body>
</html>
