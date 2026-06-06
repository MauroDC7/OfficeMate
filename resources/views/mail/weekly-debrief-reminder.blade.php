@extends('mail.timetraq.layout', [
    'logoUrl' => rtrim(config('app.url'), '/').'/img/logoTransparent.png',
    'title' => 'Weekstatus',
])

@section('content')
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111827;letter-spacing:-0.02em;">
        Hoi {{ $firstName }},
    </h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
        Het is tijd voor je weekstatus. Wat was deze week moeilijk en wat ga je volgende week doen?
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
        <tr>
            <td style="border-radius:10px;background-color:#dc2626;">
                <a href="{{ $projectsUrl }}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
                    Weekstatus invullen
                </a>
            </td>
        </tr>
    </table>

    <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
        Je vult dit in op de projectenpagina in TimeTraq.
    </p>
@endsection

@section('footer')
    Als je al hebt ingevuld, kun je deze e-mail negeren.
@endsection
