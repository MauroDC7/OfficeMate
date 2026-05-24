@extends('mail.timetraq.layout', [
    'logoUrl' => rtrim(config('app.url'), '/').'/img/logoTransparent.png',
    'title' => 'Welkom bij TimeTraq',
])

@section('content')
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;letter-spacing:-0.02em;">
        Welkom, {{ $firstName }}!
    </h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
        Bedankt voor je registratie bij TimeTraq. Bevestig je e-mailadres om je account te activeren en aan de slag te gaan.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
        <tr>
            <td style="border-radius:10px;background-color:#dc2626;">
                <a href="{{ $verificationUrl }}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
                    E-mailadres bevestigen
                </a>
            </td>
        </tr>
    </table>

    <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#6b7280;">
        Deze link is {{ $expireMinutes }} minuten geldig. Werkt de knop niet? Kopieer deze link in je browser:
    </p>
    <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;word-break:break-all;">
        {{ $verificationUrl }}
    </p>
@endsection

@section('footer')
    Als je geen account hebt aangemaakt, kun je deze e-mail negeren.
@endsection
