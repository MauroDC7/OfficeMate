<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    @php
        $appName = config('app.name', 'TimeTraq');
        $appTagline = 'Slim tijd registreren met AI-voorstellen, teams en verlof in één werkplek.';
        $logoUrl = asset('img/Logo.png');
    @endphp
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="theme-color" content="#ffffff">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <link rel="icon" type="image/png" href="{{ $logoUrl }}" sizes="any">
        <link rel="apple-touch-icon" href="{{ $logoUrl }}">

        <meta name="application-name" content="{{ $appName }}">
        <meta name="description" content="{{ $appTagline }}">

        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{ $appName }}">
        <meta property="og:title" content="{{ $appName }}">
        <meta property="og:description" content="{{ $appTagline }}">
        <meta property="og:image" content="{{ $logoUrl }}">
        <meta property="og:url" content="{{ url()->current() }}">

        <meta name="twitter:card" content="summary">
        <meta name="twitter:title" content="{{ $appName }}">
        <meta name="twitter:description" content="{{ $appTagline }}">
        <meta name="twitter:image" content="{{ $logoUrl }}">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ $appName }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
