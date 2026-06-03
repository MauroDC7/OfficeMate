import { Head, Link, router, usePage } from '@inertiajs/react';

import { UserAvatar } from '@/components/user-avatar';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { weeklyDebrief as adminWeeklyDebrief } from '@/routes/admin';
import type { AdminWeeklyDebriefPageProps } from '@/types/admin-weekly-debrief';

function DebriefSummaryContent({ content }: { content: string }) {
    const sections = content.split(/\n(?=## )/).filter((section) => section.trim() !== '');

    if (sections.length === 0) {
        return (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">{content}</p>
        );
    }

    return (
        <div className="space-y-4">
            {sections.map((section) => {
                const lines = section.trim().split('\n');
                const title = lines[0]?.replace(/^##\s*/, '') ?? '';
                const body = lines.slice(1).join('\n').trim();

                return (
                    <div key={title}>
                        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                        {body !== '' ? (
                            <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                                {body}
                            </p>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

function formatGeneratedAt(iso: string | null): string | null {
    if (iso === null) {
        return null;
    }

    return new Intl.DateTimeFormat('nl-BE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(iso));
}

export default function AdminWeeklyDebrief() {
    const {
        organizationName,
        weekStart,
        weekLabel,
        previousWeek,
        nextWeek,
        submittedCount,
        rows,
        aiConfigured,
        canGenerateSummary,
        summary,
    } = usePage<AdminWeeklyDebriefPageProps>().props;

    const generatedLabel = summary ? formatGeneratedAt(summary.generated_at) : null;

    function generateSummary() {
        router.post(
            adminWeeklyDebrief.summarize.url(),
            { week: weekStart },
            { preserveScroll: true },
        );
    }

    return (
        <AppLayout>
            <Head title="Weekly debrief" />
            <main className="mx-auto box-border w-full min-w-0 max-w-5xl px-4 py-4 sm:px-6 sm:py-6 lg:max-w-6xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                            Weekly debrief
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Overzicht per week voor {organizationName}.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {previousWeek !== null ? (
                            <Link
                                href={adminWeeklyDebrief.url({ query: { week: previousWeek } })}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                                preserveScroll
                            >
                                Vorige week
                            </Link>
                        ) : null}
                        {nextWeek !== null ? (
                            <Link
                                href={adminWeeklyDebrief.url({ query: { week: nextWeek } })}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                                preserveScroll
                            >
                                Volgende week
                            </Link>
                        ) : null}
                    </div>
                </div>

                <div className="mt-5 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-sm font-medium text-gray-900">{weekLabel}</p>
                    <p className="mt-0.5 text-sm text-gray-500">
                        {submittedCount} van {rows.length} ingevuld
                    </p>
                </div>

                <section className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">AI-teamsamenvatting</h2>
                            <p className="mt-1 text-sm text-gray-600">
                                Beknopte samenvatting van alle ingevulde debriefs voor deze week.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={generateSummary}
                            disabled={!canGenerateSummary}
                            className={cn(
                                'shrink-0 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition',
                                canGenerateSummary
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'cursor-not-allowed bg-gray-200 text-gray-500',
                            )}
                        >
                            {summary ? 'Opnieuw genereren' : 'Samenvatting genereren'}
                        </button>
                    </div>

                    {!aiConfigured ? (
                        <p className="mt-4 text-sm text-amber-800">
                            OPENAI_API_KEY ontbreekt in de omgeving. Voeg een sleutel toe om
                            samenvattingen te kunnen maken.
                        </p>
                    ) : null}

                    {aiConfigured && submittedCount === 0 ? (
                        <p className="mt-4 text-sm text-gray-600">
                            Er zijn nog geen ingevulde debriefs voor deze week.
                        </p>
                    ) : null}

                    {summary ? (
                        <div className="mt-4 rounded-lg border border-indigo-100 bg-white p-4">
                            {generatedLabel !== null ? (
                                <p className="text-xs text-gray-500">
                                    Gegenereerd op {generatedLabel} · {summary.submitted_count} van{' '}
                                    {summary.total_members} debriefs
                                </p>
                            ) : null}
                            <div className="mt-3">
                                <DebriefSummaryContent content={summary.content} />
                            </div>
                        </div>
                    ) : aiConfigured && submittedCount > 0 ? (
                        <p className="mt-4 text-sm text-gray-600">
                            Nog geen samenvatting voor deze week. Klik op &quot;Samenvatting
                            genereren&quot;.
                        </p>
                    ) : null}
                </section>

                <section className="mt-5 space-y-4">
                    {rows.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
                            Geen medewerkers in deze organisatie.
                        </div>
                    ) : (
                        rows.map((row) => (
                            <article
                                key={row.user.id}
                                className={cn(
                                    'rounded-xl border bg-white p-5 shadow-sm',
                                    row.submitted ? 'border-gray-200' : 'border-amber-200',
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <UserAvatar user={row.user} className="size-10 text-sm" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-sm font-semibold text-gray-900">
                                                {row.user.name}
                                            </h2>
                                            <span
                                                className={cn(
                                                    'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                                    row.submitted
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-amber-100 text-amber-900',
                                                )}
                                            >
                                                {row.submitted ? 'Ingevuld' : 'Nog niet ingevuld'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">{row.user.email}</p>
                                    </div>
                                </div>

                                {row.submitted ? (
                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                                Moeilijk deze week
                                            </p>
                                            <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                                                {row.difficult_this_week}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                                Volgende week
                                            </p>
                                            <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                                                {row.plans_next_week}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-4 text-sm text-gray-500">
                                        Nog geen weekly debrief voor week {weekStart}.
                                    </p>
                                )}
                            </article>
                        ))
                    )}
                </section>
            </main>
        </AppLayout>
    );
}
