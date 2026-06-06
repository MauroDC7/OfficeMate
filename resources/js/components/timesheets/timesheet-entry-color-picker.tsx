import { useId } from 'react';

import { cn } from '@/lib/utils';

type TimesheetEntryColorPickerProps = {
    value: string;
    onChange: (hex: string) => void;
    disabled?: boolean;
};

export function TimesheetEntryColorPicker({
    value,
    onChange,
    disabled = false,
}: TimesheetEntryColorPickerProps) {
    const inputId = useId();

    return (
        <label
            htmlFor={inputId}
            title="Kleur kiezen"
            className={cn(
                'relative flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-gray-300 ring-1 ring-gray-200/80 transition hover:scale-105 hover:border-gray-400',
                disabled && 'pointer-events-none cursor-not-allowed opacity-40',
            )}
            style={{ backgroundColor: value }}
            onClick={(event) => event.stopPropagation()}
        >
            <input
                id={inputId}
                type="color"
                value={value}
                disabled={disabled}
                aria-label="Kleur van registratie"
                onChange={(event) => onChange(event.target.value)}
                className="sr-only"
            />
        </label>
    );
}
