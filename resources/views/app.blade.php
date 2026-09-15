<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="domain-verification" content="929a7a357472f8778a7a24fa292db91ca9c505614008522ec84986ef4ed44318">

    {{-- Google Tag Manager --}}
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WN832J64');</script>
    {{-- End Google Tag Manager --}}

    {{-- Meta Pixel Code --}}
    <script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1397255531928997');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=1397255531928997&ev=PageView&noscript=1"
/></noscript>
    {{-- End Meta Pixel Code --}}

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
    {{-- Google Tag Manager (noscript) --}}
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WN832J64"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    {{-- End Google Tag Manager (noscript) --}}

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
