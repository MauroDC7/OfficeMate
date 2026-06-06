import { Form } from '@inertiajs/react';
import { useState } from 'react';

import { useAlert } from '@/components/alert';
import { update as updateOfficeIps } from '@/routes/settings/organization/office-ips';

export type OfficePresenceSettingsPayload = {
    office_ip_addresses: string[];
};

type OfficePresenceSettingsSectionProps = {
    officePresence: OfficePresenceSettingsPayload;
};

const inputClass =
    'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10';

export function OfficePresenceSettingsSection({ officePresence }: OfficePresenceSettingsSectionProps) {
    const { success } = useAlert();
    const [addresses, setAddresses] = useState<string[]>(
        officePresence.office_ip_addresses.length > 0 ? officePresence.office_ip_addresses : [''],
    );

    const updateAddress = (index: number, value: string) => {
        setAddresses((current) => current.map((address, i) => (i === index ? value : address)));
    };

    const addAddress = () => {
        setAddresses((current) => [...current, '']);
    };

    const removeAddress = (index: number) => {
        setAddresses((current) => current.filter((_, i) => i !== index));
    };

    return (
        <section
            className="mt-5 w-full min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-6 sm:rounded-2xl lg:mt-7"
            aria-labelledby="office-presence-settings-title"
        >
            <div className="border-b border-gray-200 px-5 py-4 sm:px-6 sm:py-5">
                <h2 id="office-presence-settings-title" className="text-base font-semibold text-gray-900">
                    Kantoor IP-adressen
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
                    Vul het IP in dat onze server ziet wanneer iemand op kantoor-wifi de app opent — niet het
                    192.168-adres van je laptop. Op kantoor: zoek &quot;what is my ip&quot; op het
                    kantoor-netwerk. Lokaal testen: voeg <span className="font-medium text-gray-700">127.0.0.1</span> toe.
                </p>
            </div>

            <Form
                {...updateOfficeIps.form.patch()}
                onSuccess={() => success('Kantoor IP-adressen opgeslagen.')}
                className="space-y-4 px-5 py-5 sm:px-6 sm:py-6"
            >
                {addresses.map((address, index) => (
                    <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1">
                            <label htmlFor={`office-ip-${index}`} className="text-sm font-medium text-gray-700">
                                IP-adres {index + 1}
                            </label>
                            <input
                                id={`office-ip-${index}`}
                                name={`office_ip_addresses[${index}]`}
                                type="text"
                                value={address}
                                onChange={(event) => updateAddress(index, event.target.value)}
                                placeholder="203.0.113.10"
                                className={inputClass}
                            />
                        </div>
                        {addresses.length > 1 ? (
                            <button
                                type="button"
                                onClick={() => removeAddress(index)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                                Verwijderen
                            </button>
                        ) : null}
                    </div>
                ))}

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={addAddress}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        IP toevoegen
                    </button>
                    <button
                        type="submit"
                        className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                    >
                        Opslaan
                    </button>
                </div>
            </Form>
        </section>
    );
}
