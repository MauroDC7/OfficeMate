import { Form } from '@inertiajs/react';

import { useAlert } from '@/components/alert';
import { store as storeOrganization } from '@/routes/settings/organization';

const inputClass =
    'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10';

const primaryButtonClass =
    'rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60';

export function OrganizationSetupSection() {
    const { success } = useAlert();

    return (
        <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:mt-6 sm:p-6 lg:mt-7">
            <h2 className="text-base font-semibold text-gray-900">Bedrijf starten</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
                Nog geen uitnodiging ontvangen? Maak je eerste bedrijf aan en word beheerder. Heb je al een
                bedrijf en wil je opnieuw beginnen? Ga naar Teams → Organisatie → Nieuw bedrijf starten.
            </p>
            <Form
                {...storeOrganization.form.post()}
                options={{ preserveScroll: true }}
                onSuccess={() => success('Organisatie aangemaakt. Je bent nu beheerder.')}
                className="mt-4 max-w-md"
            >
                {({ errors, processing }) => (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="organization-name" className="text-sm font-medium text-gray-900">
                                Bedrijfsnaam
                            </label>
                            <input
                                id="organization-name"
                                type="text"
                                name="name"
                                required
                                autoComplete="organization"
                                placeholder="bijv. Acme BV"
                                className={inputClass}
                            />
                            {errors.name !== undefined ? (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            ) : null}
                        </div>
                        <button type="submit" disabled={processing} className={primaryButtonClass}>
                            {processing ? 'Bezig…' : 'Organisatie aanmaken'}
                        </button>
                    </div>
                )}
            </Form>
        </section>
    );
}
