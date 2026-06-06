import { cn } from '@/lib/utils';

type SettingsSwitchProps = {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description: string;
    disabled?: boolean;
};

export function SettingsSwitch({
    id,
    checked,
    onChange,
    label,
    description,
    disabled = false,
}: SettingsSwitchProps) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
                <label htmlFor={id} className="text-sm font-medium text-gray-900">
                    {label}
                </label>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{description}</p>
            </div>
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={cn(
                    'relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600',
                    checked ? 'bg-red-600' : 'bg-gray-300',
                    disabled && 'cursor-not-allowed opacity-50',
                )}
            >
                <span
                    className={cn(
                        'pointer-events-none inline-block size-5 translate-y-0.5 rounded-full bg-white shadow transition',
                        checked ? 'translate-x-5' : 'translate-x-0.5',
                    )}
                />
            </button>
        </div>
    );
}
