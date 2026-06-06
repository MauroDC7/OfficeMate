import { Form, router, usePage } from '@inertiajs/react';
import { useEffect, useId, useState } from 'react';

import { useAlert } from '@/components/alert';
import {
    fetchEmployeeSearch,
    type EmployeeSearchResult,
} from '@/components/settings/fetch-employee-search';
import { UserAvatar } from '@/components/user-avatar';
import { getUserDisplayFullName } from '@/lib/user-display';
import { cn } from '@/lib/utils';
import { update as updateEmployment } from '@/routes/settings/employees/employment';
import { store as storeProfile, update as updateProfile, destroy as destroyProfile } from '@/routes/settings/employment-profiles';
import { update as updateDefaults } from '@/routes/settings/organization/employment-defaults';
import type { User } from '@/types/auth';

export type EmploymentProfilePayload = {
    id: number;
    name: string;
    weekly_work_hours: number;
    annual_leave_days: number;
};

export type EmploymentSettingsPayload = {
    defaults: {
        weekly_work_hours: number;
        annual_leave_days: number;
    };
    profiles: EmploymentProfilePayload[];
    max_profiles: number;
    preselectedEmployee: EmployeeSearchResult | null;
};

type EmploymentSettingsSectionProps = {
    employment: EmploymentSettingsPayload;
};

type EmploymentMode = 'organization_default' | 'profile' | 'custom';

type SettingsEmploymentPageProps = {
    employment: EmploymentSettingsPayload;
};

const inputClass =
    'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10';

const primaryButtonClass =
    'rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60';

const secondaryButtonClass =
    'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60';

function resolveMode(employee: EmployeeSearchResult, defaults: EmploymentSettingsPayload['defaults']): EmploymentMode {
    if (employee.employment_profile_id !== null) {
        return 'profile';
    }

    if (
        employee.weekly_work_hours === defaults.weekly_work_hours &&
        employee.annual_leave_days === defaults.annual_leave_days
    ) {
        return 'organization_default';
    }

    return 'custom';
}

export function EmploymentSettingsSection({ employment: initialEmployment }: EmploymentSettingsSectionProps) {
    const { success, error } = useAlert();
    const pageEmployment = usePage<SettingsEmploymentPageProps>().props.employment;
    const employment = pageEmployment ?? initialEmployment;

    const [showAddProfile, setShowAddProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<EmployeeSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);
    const [assignmentMode, setAssignmentMode] = useState<EmploymentMode>('organization_default');
    const [profileId, setProfileId] = useState<number | ''>('');
    const [customWeekly, setCustomWeekly] = useState(employment.defaults.weekly_work_hours);
    const [customLeave, setCustomLeave] = useState(employment.defaults.annual_leave_days);
    const [savingAssignment, setSavingAssignment] = useState(false);

    const defaultsFormId = useId();
    const addProfileFormId = useId();
    const searchId = useId();

    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);

            return;
        }

        const handle = window.setTimeout(() => {
            setSearching(true);
            void fetchEmployeeSearch(searchQuery)
                .then(setSearchResults)
                .finally(() => setSearching(false));
        }, 300);

        return () => window.clearTimeout(handle);
    }, [searchQuery]);

    function selectEmployee(employee: EmployeeSearchResult) {
        setSelectedEmployee(employee);
        setSearchQuery('');
        setSearchResults([]);

        const mode = resolveMode(employee, employment.defaults);
        setAssignmentMode(mode);
        setProfileId(employee.employment_profile_id ?? '');
        setCustomWeekly(employee.weekly_work_hours);
        setCustomLeave(employee.annual_leave_days);
    }

    useEffect(() => {
        const preselected = employment.preselectedEmployee;

        if (preselected === null) {
            return;
        }

        selectEmployee(preselected);

        document.getElementById('employment-exception')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    function saveAssignment() {
        if (selectedEmployee === null) {
            return;
        }

        const payload =
            assignmentMode === 'organization_default'
                ? { mode: 'organization_default' as const }
                : assignmentMode === 'profile'
                  ? {
                        mode: 'profile' as const,
                        employment_profile_id: profileId === '' ? undefined : Number(profileId),
                    }
                  : {
                        mode: 'custom' as const,
                        weekly_work_hours: customWeekly,
                        annual_leave_days: customLeave,
                    };

        setSavingAssignment(true);
        router.patch(updateEmployment.url({ user: selectedEmployee.id }), payload, {
            preserveScroll: true,
            onSuccess: () => {
                success(`Contract ingesteld voor ${getUserDisplayFullName(selectedEmployee as User)}.`);
                setSelectedEmployee(null);
                setSavingAssignment(false);
            },
            onError: () => {
                error('Opslaan mislukt. Controleer je keuze en probeer opnieuw.');
                setSavingAssignment(false);
            },
        });
    }

    const canAddProfile = employment.profiles.length < employment.max_profiles;

    return (
        <section
            className="mt-5 w-full min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-6 sm:rounded-2xl lg:mt-7"
            aria-labelledby="employment-settings-title"
        >
            <div className="border-b border-gray-200 px-5 py-4 sm:px-6 sm:py-5">
                <h2 id="employment-settings-title" className="text-base font-semibold text-gray-900">
                    Werkuren & verlof
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
                    Standaarden voor nieuwe medewerkers, contracttypes om bulk toe te passen, en zoeken voor
                    uitzonderingen.
                </p>
            </div>

            <div className="space-y-8 px-5 py-5 sm:px-6 sm:py-6">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Organisatie-standaard</h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Geldt voor nieuwe uitnodigingen. Bestaande medewerkers blijven ongewijzigd tot je ze
                        aanpast.
                    </p>
                    <Form
                        {...updateDefaults.form.patch()}
                        options={{ preserveScroll: true }}
                        onSuccess={() => success('Organisatie-standaard opgeslagen.')}
                        className="mt-4"
                    >
                        {({ errors, processing }) => (
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                <div className="flex-1">
                                    <label htmlFor={`${defaultsFormId}-weekly`} className="text-sm font-medium text-gray-800">
                                        Uren per week
                                    </label>
                                    <input
                                        id={`${defaultsFormId}-weekly`}
                                        type="number"
                                        name="default_weekly_work_hours"
                                        min={1}
                                        max={60}
                                        required
                                        defaultValue={employment.defaults.weekly_work_hours}
                                        className={inputClass}
                                    />
                                    {errors.default_weekly_work_hours !== undefined ? (
                                        <p className="mt-1 text-xs text-red-600">{errors.default_weekly_work_hours}</p>
                                    ) : null}
                                </div>
                                <div className="flex-1">
                                    <label htmlFor={`${defaultsFormId}-leave`} className="text-sm font-medium text-gray-800">
                                        Verlofdagen per jaar
                                    </label>
                                    <input
                                        id={`${defaultsFormId}-leave`}
                                        type="number"
                                        name="default_annual_leave_days"
                                        min={0}
                                        max={365}
                                        required
                                        defaultValue={employment.defaults.annual_leave_days}
                                        className={inputClass}
                                    />
                                    {errors.default_annual_leave_days !== undefined ? (
                                        <p className="mt-1 text-xs text-red-600">{errors.default_annual_leave_days}</p>
                                    ) : null}
                                </div>
                                <button type="submit" disabled={processing} className={primaryButtonClass}>
                                    {processing ? 'Opslaan…' : 'Opslaan'}
                                </button>
                            </div>
                        )}
                    </Form>
                </div>

                <div className="border-t border-gray-200 pt-8">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Contracttypes</h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Max. {employment.max_profiles} types (bijv. voltijd, deeltijd). Wijzigingen gelden
                                direct voor gekoppelde medewerkers.
                            </p>
                        </div>
                        {canAddProfile && !showAddProfile ? (
                            <button
                                type="button"
                                onClick={() => setShowAddProfile(true)}
                                className={secondaryButtonClass}
                            >
                                + Contracttype
                            </button>
                        ) : null}
                    </div>

                    {employment.profiles.length === 0 && !showAddProfile ? (
                        <p className="mt-4 text-sm text-gray-500">Nog geen contracttypes. Voeg er een toe als je teams verschillende regimes hebben.</p>
                    ) : null}

                    <ul className="mt-4 space-y-3">
                        {employment.profiles.map((profile) => (
                            <li
                                key={profile.id}
                                className="rounded-lg border border-gray-200 bg-gray-50/50 p-4"
                            >
                                <Form
                                    {...updateProfile.form.patch({ employment_profile: profile.id })}
                                    options={{ preserveScroll: true }}
                                    onSuccess={() => success(`Contracttype “${profile.name}” opgeslagen.`)}
                                >
                                    {({ errors, processing }) => (
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                                            <div className="flex-1">
                                                <label className="text-xs font-medium text-gray-600">Naam</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    required
                                                    defaultValue={profile.name}
                                                    className={inputClass}
                                                />
                                                {errors.name !== undefined ? (
                                                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                                                ) : null}
                                            </div>
                                            <div className="w-full sm:w-28">
                                                <label className="text-xs font-medium text-gray-600">Uren/week</label>
                                                <input
                                                    type="number"
                                                    name="weekly_work_hours"
                                                    min={1}
                                                    max={60}
                                                    required
                                                    defaultValue={profile.weekly_work_hours}
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div className="w-full sm:w-28">
                                                <label className="text-xs font-medium text-gray-600">Verlof/jaar</label>
                                                <input
                                                    type="number"
                                                    name="annual_leave_days"
                                                    min={0}
                                                    max={365}
                                                    required
                                                    defaultValue={profile.annual_leave_days}
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="submit" disabled={processing} className={primaryButtonClass}>
                                                    Opslaan
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={processing}
                                                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                                    onClick={() => {
                                                        if (
                                                            !window.confirm(
                                                                `Contracttype “${profile.name}” verwijderen? Gekoppelde medewerkers krijgen de organisatie-standaard.`,
                                                            )
                                                        ) {
                                                            return;
                                                        }

                                                        router.delete(
                                                            destroyProfile.url({ employment_profile: profile.id }),
                                                            {
                                                                preserveScroll: true,
                                                                onSuccess: () =>
                                                                    success(`Contracttype “${profile.name}” verwijderd.`),
                                                            },
                                                        );
                                                    }}
                                                >
                                                    Verwijderen
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Form>
                            </li>
                        ))}
                    </ul>

                    {showAddProfile && canAddProfile ? (
                        <Form
                            {...storeProfile.form.post()}
                            options={{ preserveScroll: true }}
                            onSuccess={() => {
                                success('Contracttype toegevoegd.');
                                setShowAddProfile(false);
                            }}
                            className="mt-4 rounded-lg border border-dashed border-gray-300 p-4"
                        >
                            {({ errors, processing }) => (
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                                    <div className="flex-1">
                                        <label htmlFor={`${addProfileFormId}-name`} className="text-xs font-medium text-gray-600">
                                            Naam
                                        </label>
                                        <input
                                            id={`${addProfileFormId}-name`}
                                            type="text"
                                            name="name"
                                            required
                                            placeholder="bijv. Deeltijd"
                                            className={inputClass}
                                        />
                                        {errors.name !== undefined ? (
                                            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                                        ) : null}
                                    </div>
                                    <div className="w-full sm:w-28">
                                        <label className="text-xs font-medium text-gray-600">Uren/week</label>
                                        <input
                                            type="number"
                                            name="weekly_work_hours"
                                            min={1}
                                            max={60}
                                            required
                                            defaultValue={employment.defaults.weekly_work_hours}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="w-full sm:w-28">
                                        <label className="text-xs font-medium text-gray-600">Verlof/jaar</label>
                                        <input
                                            type="number"
                                            name="annual_leave_days"
                                            min={0}
                                            max={365}
                                            required
                                            defaultValue={employment.defaults.annual_leave_days}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={processing} className={primaryButtonClass}>
                                            Toevoegen
                                        </button>
                                        <button
                                            type="button"
                                            className={secondaryButtonClass}
                                            onClick={() => setShowAddProfile(false)}
                                        >
                                            Annuleren
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Form>
                    ) : null}
                </div>

                <div id="employment-exception" className="border-t border-gray-200 pt-8 scroll-mt-6">
                    <h3 className="text-sm font-semibold text-gray-900">Uitzondering per medewerker</h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Zoek op naam of e-mail (min. 2 tekens). Handig bij grote teams — geen lange lijst.
                    </p>

                    <label htmlFor={searchId} className="sr-only">
                        Medewerker zoeken
                    </label>
                    <input
                        id={searchId}
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="bijv. jan@bedrijf.nl"
                        className={cn(inputClass, 'mt-3 max-w-md')}
                        autoComplete="off"
                    />

                    {searching ? (
                        <p className="mt-2 text-xs text-gray-500">Zoeken…</p>
                    ) : null}

                    {searchResults.length > 0 ? (
                        <ul className="mt-2 max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            {searchResults.map((result) => (
                                <li key={result.id}>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-gray-50"
                                        onClick={() => selectEmployee(result)}
                                    >
                                        <UserAvatar user={result} className="size-8" textClassName="text-xs" />
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium text-gray-900">
                                                {getUserDisplayFullName(result as User)}
                                            </span>
                                            <span className="block truncate text-xs text-gray-500">{result.email}</span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}

                    {selectedEmployee !== null ? (
                        <div className="mt-4 max-w-lg rounded-lg border border-gray-200 bg-gray-50/80 p-4">
                            <div className="flex items-center gap-3">
                                <UserAvatar user={selectedEmployee} className="size-10" />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-gray-900">
                                        {getUserDisplayFullName(selectedEmployee as User)}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">{selectedEmployee.email}</p>
                                </div>
                                <button
                                    type="button"
                                    className="ml-auto text-xs font-medium text-gray-500 hover:text-gray-800"
                                    onClick={() => setSelectedEmployee(null)}
                                >
                                    Sluiten
                                </button>
                            </div>

                            <fieldset className="mt-4 space-y-3">
                                <legend className="sr-only">Contractkeuze</legend>

                                <label className="flex cursor-pointer gap-3 rounded-lg border border-gray-200 bg-white p-3 has-checked:border-gray-900 has-checked:ring-1 has-checked:ring-gray-900">
                                    <input
                                        type="radio"
                                        name="employment-mode"
                                        className="mt-1"
                                        checked={assignmentMode === 'organization_default'}
                                        onChange={() => setAssignmentMode('organization_default')}
                                    />
                                    <span className="text-sm text-gray-700">
                                        <span className="font-medium text-gray-900">Organisatie-standaard</span>
                                        <span className="mt-0.5 block text-xs text-gray-500">
                                            {employment.defaults.weekly_work_hours} u/week ·{' '}
                                            {employment.defaults.annual_leave_days} verlofdagen
                                        </span>
                                    </span>
                                </label>

                                {employment.profiles.length > 0 ? (
                                    <label className="flex cursor-pointer gap-3 rounded-lg border border-gray-200 bg-white p-3 has-checked:border-gray-900 has-checked:ring-1 has-checked:ring-gray-900">
                                        <input
                                            type="radio"
                                            name="employment-mode"
                                            className="mt-1"
                                            checked={assignmentMode === 'profile'}
                                            onChange={() => {
                                                setAssignmentMode('profile');
                                                if (profileId === '' && employment.profiles[0] !== undefined) {
                                                    setProfileId(employment.profiles[0].id);
                                                }
                                            }}
                                        />
                                        <span className="min-w-0 flex-1 text-sm text-gray-700">
                                            <span className="font-medium text-gray-900">Contracttype</span>
                                            <select
                                                className={cn(inputClass, 'mt-2')}
                                                value={profileId}
                                                disabled={assignmentMode !== 'profile'}
                                                onChange={(event) => setProfileId(Number(event.target.value))}
                                            >
                                                {employment.profiles.map((profile) => (
                                                    <option key={profile.id} value={profile.id}>
                                                        {profile.name} ({profile.weekly_work_hours} u,{' '}
                                                        {profile.annual_leave_days} d)
                                                    </option>
                                                ))}
                                            </select>
                                        </span>
                                    </label>
                                ) : null}

                                <label className="flex cursor-pointer gap-3 rounded-lg border border-gray-200 bg-white p-3 has-checked:border-gray-900 has-checked:ring-1 has-checked:ring-gray-900">
                                    <input
                                        type="radio"
                                        name="employment-mode"
                                        className="mt-1"
                                        checked={assignmentMode === 'custom'}
                                        onChange={() => setAssignmentMode('custom')}
                                    />
                                    <span className="flex-1 text-sm text-gray-700">
                                        <span className="font-medium text-gray-900">Aangepast</span>
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                max={60}
                                                disabled={assignmentMode !== 'custom'}
                                                value={customWeekly}
                                                onChange={(event) => setCustomWeekly(Number(event.target.value))}
                                                className={inputClass}
                                                aria-label="Aangepaste uren per week"
                                            />
                                            <input
                                                type="number"
                                                min={0}
                                                max={365}
                                                disabled={assignmentMode !== 'custom'}
                                                value={customLeave}
                                                onChange={(event) => setCustomLeave(Number(event.target.value))}
                                                className={inputClass}
                                                aria-label="Aangepaste verlofdagen"
                                            />
                                        </div>
                                    </span>
                                </label>
                            </fieldset>

                            <button
                                type="button"
                                disabled={savingAssignment || (assignmentMode === 'profile' && profileId === '')}
                                className={cn(primaryButtonClass, 'mt-4')}
                                onClick={saveAssignment}
                            >
                                {savingAssignment ? 'Opslaan…' : 'Toepassen op medewerker'}
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
