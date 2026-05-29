import type { TimesheetProjectOption } from '@/types/timesheets';

type TimesheetProjectSelectProps = {
    id: string;
    value: string;
    options: TimesheetProjectOption[];
    onChange: (projectId: string) => void;
    error?: string;
    className?: string;
};

export function formatTimesheetProjectLabel(option: TimesheetProjectOption): string {
    if (option.type === 'external' && option.client_name !== null && option.client_name !== '') {
        return `${option.name} (${option.client_name})`;
    }

    return option.name;
}

export function TimesheetProjectSelect({
    id,
    value,
    options,
    onChange,
    error,
    className,
}: TimesheetProjectSelectProps) {
    return (
        <div>
            <label htmlFor={id} className="text-sm font-medium text-gray-800">
                Project{' '}
                <span className="font-normal text-gray-500">(optioneel)</span>
            </label>
            <select
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={
                    className ??
                    'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none'
                }
            >
                <option value="">Geen project</option>
                {options.map((option) => (
                    <option key={option.id} value={String(option.id)}>
                        {formatTimesheetProjectLabel(option)}
                    </option>
                ))}
            </select>
            {error !== undefined ? (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            ) : null}
        </div>
    );
}
