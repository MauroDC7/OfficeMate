<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="utf-8">
    <title>Urenrapport — {{ $organizationName }}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #111827;
            margin: 0;
            padding: 24px;
        }
        .header {
            width: 100%;
            margin-bottom: 20px;
            border-bottom: 2px solid #dc2626;
            padding-bottom: 14px;
        }
        .header-table { width: 100%; border-collapse: collapse; }
        .header-table td { vertical-align: middle; padding: 0; }
        .logo { height: 42px; }
        .brand-title {
            font-size: 20px;
            font-weight: bold;
            color: #111827;
            margin: 0;
        }
        .brand-subtitle {
            font-size: 12px;
            color: #6b7280;
            margin: 4px 0 0;
        }
        .meta {
            text-align: right;
            font-size: 10px;
            color: #4b5563;
            line-height: 1.5;
        }
        .summary {
            width: 100%;
            margin-bottom: 18px;
            border-collapse: collapse;
        }
        .summary td {
            width: 33.33%;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 10px 12px;
        }
        .summary-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #6b7280;
        }
        .summary-value {
            font-size: 16px;
            font-weight: bold;
            margin-top: 4px;
            color: #111827;
        }
        .entries {
            width: 100%;
            border-collapse: collapse;
        }
        .entries th {
            background: #111827;
            color: #ffffff;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            padding: 8px 6px;
            text-align: left;
        }
        .entries td {
            border-bottom: 1px solid #e5e7eb;
            padding: 7px 6px;
            vertical-align: top;
        }
        .entries tr:nth-child(even) td {
            background: #f9fafb;
        }
        .footer {
            margin-top: 16px;
            font-size: 9px;
            color: #9ca3af;
            text-align: center;
        }
        .empty {
            padding: 24px;
            text-align: center;
            color: #6b7280;
            border: 1px dashed #d1d5db;
        }
    </style>
</head>
<body>
    <div class="header">
        <table class="header-table">
            <tr>
                <td style="width: 60px;">
                    @if ($logoDataUri !== null)
                        <img src="{{ $logoDataUri }}" alt="TimeTraq" class="logo">
                    @endif
                </td>
                <td>
                    <p class="brand-title">TimeTraq — Urenrapport</p>
                    <p class="brand-subtitle">{{ $organizationName }}</p>
                </td>
                <td class="meta">
                    Periode: {{ $filters->startsOn }} t/m {{ $filters->endsOn }}<br>
                    Gegenereerd: {{ $generatedAt }}
                </td>
            </tr>
        </table>
    </div>

    <table class="summary">
        <tr>
            <td>
                <div class="summary-label">Regels</div>
                <div class="summary-value">{{ $summary['entry_count'] }}</div>
            </td>
            <td>
                <div class="summary-label">Totaal uren</div>
                <div class="summary-value">
                    @php
                        $hours = intdiv($summary['total_minutes'], 60);
                        $minutes = $summary['total_minutes'] % 60;
                    @endphp
                    {{ $hours }}u {{ str_pad((string) $minutes, 2, '0', STR_PAD_LEFT) }}m
                </div>
            </td>
            <td>
                <div class="summary-label">Medewerkers</div>
                <div class="summary-value">{{ $summary['employee_count'] }}</div>
            </td>
        </tr>
    </table>

    @if (count($rows) === 0)
        <div class="empty">Geen uren gevonden voor de gekozen filters.</div>
    @else
        <table class="entries">
            <thead>
                <tr>
                    <th>Medewerker</th>
                    <th>Datum</th>
                    <th>Tijd</th>
                    <th>Duur</th>
                    <th>Titel</th>
                    <th>Project</th>
                    <th>Klant</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($rows as $row)
                    <tr>
                        <td>{{ $row->employeeName }}</td>
                        <td>{{ $row->workedOn }}</td>
                        <td>{{ $row->startTime }} – {{ $row->endTime }}</td>
                        <td>{{ $row->durationLabel }}</td>
                        <td>{{ $row->title }}</td>
                        <td>{{ $row->projectName ?? '—' }}</td>
                        <td>{{ $row->clientName ?? '—' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="footer">
        TimeTraq · Alleen goedgekeurde timesheet-entries · {{ $organizationName }}
    </div>
</body>
</html>
