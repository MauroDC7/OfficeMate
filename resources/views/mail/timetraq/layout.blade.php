<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{ $title ?? config('app.name') }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f4f6;padding:40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
                    <tr>
                        <td align="center" style="padding-bottom:24px;">
                            <img src="{{ $logoUrl }}" alt="TimeTraq" width="56" height="56" style="display:block;border:0;outline:none;">
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#ffffff;border-radius:16px;border:1px solid #e5e7eb;box-shadow:0 4px 24px rgba(17,24,39,0.06);overflow:hidden;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="height:4px;background:linear-gradient(90deg,#dc2626,#ef4444);font-size:0;line-height:0;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="padding:32px 28px 28px;">
                                        @yield('content')
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-top:24px;font-size:12px;line-height:1.5;color:#9ca3af;">
                            <p style="margin:0 0 4px;">&copy; {{ date('Y') }} TimeTraq</p>
                            @hasSection('footer')
                                <p style="margin:0;">@yield('footer')</p>
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
