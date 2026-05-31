import { router } from '@inertiajs/react';
import { useEffect, useId, useState } from 'react';

import { useAlert } from '@/components/alert';
import {
    fetchEmployeeSearch,
    type EmployeeSearchResult,
} from '@/components/settings/fetch-employee-search';
import { UserAvatar } from '@/components/user-avatar';
import { getUserDisplayFullName } from '@/lib/user-display';
import { cn } from '@/lib/utils';
import { store as grantAdminRole } from '@/routes/settings/employees/admin-role';
import type { User } from '@/types/auth';

const primaryButtonClass =
    'rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60';

export function AdminAccessSettingsSection() {
    const { success, error } = useAlert();
    const searchId = useId();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<EmployeeSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);
    const [granting, setGranting] = useState(false);

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

    function grantAdminAccess() {
        if (selectedEmployee === null) {
            return;
        }

        setGranting(true);
        router.post(grantAdminRole.url({ user: selectedEmployee.id }), {}, {
            preserveScroll: true,
            onSuccess: () => {
                success(`${getUserDisplayFullName(selectedEmployee as User)} is nu beheerder.`);
                setSelectedEmployee(null);
                setSearchQuery('');
                setGranting(false);
            },
            onError: () => {
                error('Beheerdersrechten toekennen mislukt. Probeer het opnieuw.');
                setGranting(false);
            },
        });
    }

    return (
        <section
            className="mt-5 w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-6 sm:rounded-2xl lg:mt-7"
            aria-labelledby="admin-access-settings-title"
        >
            <div className="border-b border-gray-200 px-5 py-4 sm:px-6 sm:py-5">
                <h2 id="admin-access-settings-title" className="text-base font-semibold text-gray-900">
                    Beheerders
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
                    Geef collega&apos;s beheerdersrechten, bijvoorbeeld voor management of HR.
                </p>
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
                <div>
                    <label htmlFor={searchId} className="text-sm font-medium text-gray-900">
                        Medewerker zoeken
                    </label>
                    <input
                        id={searchId}
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Naam of e-mail (min. 2 tekens)"
                        className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10"
                        autoComplete="off"
                    />
                    {searching ? (
                        <p className="mt-2 text-xs text-gray-500">Zoeken…</p>
                    ) : null}
                    {searchResults.length > 0 ? (
                        <ul className="mt-2 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            {searchResults.map((employee) => (
                                <li key={employee.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedEmployee(employee);
                                            setSearchQuery('');
                                            setSearchResults([]);
                                        }}
                                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-gray-50"
                                    >
                                        <UserAvatar user={employee as User} className="size-8 text-xs" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-medium text-gray-900">
                                                {getUserDisplayFullName(employee as User)}
                                            </span>
                                            <span className="block truncate text-xs text-gray-500">
                                                {employee.email}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>

                {selectedEmployee !== null ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
                        <div className="flex items-center gap-3">
                            <UserAvatar user={selectedEmployee as User} className="size-10 text-sm" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                    {getUserDisplayFullName(selectedEmployee as User)}
                                </p>
                                <p className="truncate text-xs text-gray-500">{selectedEmployee.email}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={grantAdminAccess}
                                disabled={granting}
                                className={primaryButtonClass}
                            >
                                {granting ? 'Bezig…' : 'Beheerdersrechten geven'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedEmployee(null)}
                                disabled={granting}
                                className={cn(
                                    'rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60',
                                )}
                            >
                                Annuleren
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </section>
    );
}
