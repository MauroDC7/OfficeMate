<?php

namespace App\Services\Timy;

use Illuminate\Support\Str;

/**
 * Antwoorden zonder OpenAI op basis van context en eenvoudige intent-herkenning.
 *
 * @phpstan-import-type TimyContext from TimyUserContext
 * @phpstan-import-type TimyActionLink from TimyUserContext
 */
final class TimyFallbackResponder
{
    /**
     * @param  TimyContext  $context
     * @return array{content: string, actions: list<TimyActionLink>}
     */
    public function reply(string $userMessage, array $context): array
    {
        $normalized = Str::lower(trim($userMessage));

        if ($this->matches($normalized, ['uur', 'uren', 'timesheet', 'geboekt', 'gewerkt'])) {
            return $this->hoursReply($context);
        }

        if ($this->matches($normalized, ['verlof', 'vakantie', 'ziek', 'aanvraag'])) {
            return $this->leaveReply($context);
        }

        if ($this->matches($normalized, ['project', 'projecten'])) {
            return $this->projectsReply($context);
        }

        if ($this->matches($normalized, ['debrief', 'weekly', 'weekstatus', 'status update'])) {
            return $this->weeklyDebriefReply($context);
        }

        if ($this->matches($normalized, ['admin', 'beheer', 'goedkeur', 'team', 'aanwezig', 'presence'])) {
            return $this->adminReply($context);
        }

        if ($this->matches($normalized, ['help', 'hoe', 'waar', 'navigatie', 'menu'])) {
            return $this->navigationReply($context);
        }

        if ($this->matches($normalized, ['samenvat', 'overzicht', 'vandaag', 'deze week'])) {
            return $this->summaryReply($context);
        }

        return $this->defaultReply($context);
    }

    /**
     * @param  TimyContext  $context
     * @return array{content: string, actions: list<TimyActionLink>}
     */
    private function hoursReply(array $context): array
    {
        $employee = $context['employee'];
        if (! is_array($employee)) {
            return [
                'content' => 'Timesheets zijn beschikbaar onder Timesheets. Daar boek en beheer je je uren.',
                'actions' => [
                    ['label' => 'Naar Timesheets', 'href' => route('timesheets')],
                ],
            ];
        }

        $minutes = (int) ($employee['hoursThisWeekMinutes'] ?? 0);
        $pending = (int) ($employee['pendingTimesheetCount'] ?? 0);
        $formatted = TimyUserContext::formatMinutes($minutes);

        $content = "Deze week heb je {$formatted} geboekt.";
        if ($pending > 0) {
            $content .= " Er staan {$pending} AI-voorstel(len) klaar om te beoordelen.";
        }

        return [
            'content' => $content,
            'actions' => [
                ['label' => 'Timesheets openen', 'href' => route('timesheets')],
            ],
        ];
    }

    /**
     * @param  TimyContext  $context
     * @return array{content: string, actions: list<TimyActionLink>}
     */
    private function leaveReply(array $context): array
    {
        $isAdmin = ($context['user']['role'] ?? '') === 'admin';
        $href = route($isAdmin ? 'admin.leaveRequests' : 'leaveRequests');

        $employee = $context['employee'];
        if (is_array($employee)) {
            $pending = (int) ($employee['pendingLeaveRequestCount'] ?? 0);
            $openDays = (int) ($employee['openLeaveDays'] ?? 0);

            $content = 'Verlof regel je via Verlofaanvragen.';
            if ($pending > 0) {
                $content .= " Je hebt {$pending} aanvraag/ag(en) in behandeling.";
            }
            if ($openDays > 0) {
                $content .= " Je hebt nog goedgekeurd verlof voor ongeveer {$openDays} dag(en) in de toekomst.";
            }

            return [
                'content' => $content,
                'actions' => [
                    ['label' => 'Verlof openen', 'href' => $href],
                ],
            ];
        }

        $admin = $context['admin'];
        if (is_array($admin)) {
            $pending = (int) ($admin['pendingLeaveRequestCount'] ?? 0);

            return [
                'content' => $pending > 0
                    ? "Als beheerder zie je {$pending} openstaande verlofaanvraag/ag(en) in Verlofbeheer."
                    : 'In Verlofbeheer keur je aanvragen goed of af.',
                'actions' => [
                    ['label' => 'Verlofbeheer', 'href' => $href],
                ],
            ];
        }

        return [
            'content' => 'Verlof regel je via het verlof-scherm in de app.',
            'actions' => [
                ['label' => 'Verlof openen', 'href' => $href],
            ],
        ];
    }

    /**
     * @param  TimyContext  $context
     * @return array{content: string, actions: list<TimyActionLink>}
     */
    private function projectsReply(array $context): array
    {
        $employee = $context['employee'];
        $names = [];
        if (is_array($employee)) {
            foreach ($employee['activeProjects'] ?? [] as $project) {
                if (is_array($project) && isset($project['name'])) {
                    $names[] = (string) $project['name'];
                }
            }
        }

        $content = $names === []
            ? 'Je actieve projecten staan op de projectenpagina.'
            : 'Actieve projecten: '.implode(', ', array_slice($names, 0, 5)).(count($names) > 5 ? '…' : '').'.';

        return [
            'content' => $content,
            'actions' => [
                ['label' => 'Projecten', 'href' => route('projects')],
            ],
        ];
    }

    /**
     * @param  TimyContext  $context
     * @return array{content: string, actions: list<TimyActionLink>}
     */
    private function weeklyDebriefReply(array $context): array
    {
        $weekly = $context['weekly_debrief'];
        if (! is_array($weekly)) {
            return [
                'content' => 'Weekstatus is beschikbaar zodra je aan een organisatie bent gekoppeld.',
                'actions' => [
                    ['label' => 'Projecten', 'href' => route('projects')],
                ],
            ];
        }

        $filled = (bool) ($weekly['filled'] ?? false);
        $content = $filled
            ? 'Je weekstatus voor deze week is al ingevuld. Je kunt hem op projecten bekijken of aanpassen.'
            : 'Je weekstatus voor deze week is nog niet ingevuld. Op projecten kun je hem invullen of een AI-concept laten maken.';

        return [
            'content' => $content,
            'actions' => [
                ['label' => 'Naar projecten', 'href' => route('projects')],
            ],
        ];
    }

    /**
     * @param  TimyContext  $context
     * @return array{content: string, actions: list<TimyActionLink>}
     */
    private function adminReply(array $context): array
    {
        if (($context['user']['role'] ?? '') !== 'admin') {
            return $this->defaultReply($context);
        }

        $admin = $context['admin'];
        if (! is_array($admin)) {
            return [
                'content' => 'Als beheerder gebruik je Teams en Verlofbeheer voor organisatie-taken.',
                'actions' => [
                    ['label' => 'Teams', 'href' => route('teams')],
                ],
            ];
        }

        $leave = (int) ($admin['pendingLeaveRequestCount'] ?? 0);
        $teams = (int) ($admin['pendingMembershipCount'] ?? 0);
        $proposals = (int) ($admin['pendingProposalCount'] ?? 0);
        $presence = $admin['presenceSummary'] ?? [];

        $content = sprintf(
            'Organisatie %s: %d leden, %d teams. Open: %d verlofaanvraag/ag, %d teamaanvraag/ag, %d timesheet-voorstel(len). Aanwezigheid: %d op kantoor, %d niet op kantoor.',
            (string) ($admin['organizationName'] ?? '—'),
            (int) ($admin['memberCount'] ?? 0),
            (int) ($admin['teamCount'] ?? 0),
            $leave,
            $teams,
            $proposals,
            (int) ($presence['in_office'] ?? 0),
            (int) ($presence['out_of_office'] ?? 0),
        );

        return [
            'content' => $content,
            'actions' => [
                ['label' => 'Verlofbeheer', 'href' => route('admin.leaveRequests')],
                ['label' => 'Teams', 'href' => route('teams')],
            ],
        ];
    }

    /**
     * @param  TimyContext  $context
     * @return array{content: string, actions: list<TimyActionLink>}
     */
    private function navigationReply(array $context): array
    {
        $page = $context['page'] ?? 'dashboard';
        $labels = [
            'dashboard' => 'het dashboard',
            'timesheets' => 'Timesheets',
            'projects' => 'Projecten',
            'leave_requests' => 'Verlof',
            'teams' => 'Teams',
            'settings' => 'Instellingen',
        ];

        $here = $labels[$page] ?? 'deze pagina';

        return [
            'content' => "Je bent nu op {$here}. Gebruik het menu links of een van de knoppen hieronder.",
            'actions' => array_slice($context['quick_links'] ?? [], 0, 3),
        ];
    }

    /**
     * @param  TimyContext  $context
     * @return array{content: string, actions: list<TimyActionLink>}
     */
    private function summaryReply(array $context): array
    {
        $parts = [];
        $employee = $context['employee'];
        if (is_array($employee)) {
            $parts[] = 'Uren deze week: '.TimyUserContext::formatMinutes((int) ($employee['hoursThisWeekMinutes'] ?? 0)).'.';
            if ((int) ($employee['pendingTimesheetCount'] ?? 0) > 0) {
                $parts[] = (int) $employee['pendingTimesheetCount'].' timesheet-voorstel(len) open.';
            }
            if ((int) ($employee['pendingLeaveRequestCount'] ?? 0) > 0) {
                $parts[] = (int) $employee['pendingLeaveRequestCount'].' verlofaanvraag/ag in behandeling.';
            }
        }

        $tips = $context['tips'] ?? [];
        if ($tips !== []) {
            $parts[] = 'Tip: '.$tips[0];
        }

        if ($parts === []) {
            return $this->defaultReply($context);
        }

        return [
            'content' => implode(' ', $parts),
            'actions' => array_slice($context['quick_links'] ?? [], 0, 2),
        ];
    }

    /**
     * @param  TimyContext  $context
     * @return array{content: string, actions: list<TimyActionLink>}
     */
    private function defaultReply(array $context): array
    {
        $firstName = $context['user']['first_name'] ?? 'daar';
        $configured = ! blank(config('services.openai.key'));

        $content = $configured
            ? "Hoi {$firstName}! Stel een vraag over uren, verlof, projecten of navigatie in TimeTraq."
            : "Hoi {$firstName}! Ik draai nu in eenvoudige modus (zonder OpenAI). Vraag gerust naar uren, verlof, projecten of waar je iets vindt.";

        $tips = $context['tips'] ?? [];
        if ($tips !== []) {
            $content .= ' '.$tips[0];
        }

        return [
            'content' => $content,
            'actions' => array_slice($context['quick_links'] ?? [], 0, 3),
        ];
    }

    /**
     * @param  list<string>  $needles
     */
    private function matches(string $haystack, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (str_contains($haystack, $needle)) {
                return true;
            }
        }

        return false;
    }
}
