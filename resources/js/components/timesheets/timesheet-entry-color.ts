/** Fallback when no color is stored (e.g. legacy rows). */
export const DEFAULT_TIMESHEET_ENTRY_COLOR = '#6b7280';

export function normalizeTimesheetEntryColor(color: string | null | undefined): string {
    if (typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color)) {
        return color;
    }

    return DEFAULT_TIMESHEET_ENTRY_COLOR;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const normalized = normalizeTimesheetEntryColor(hex).slice(1);

    return {
        r: Number.parseInt(normalized.slice(0, 2), 16),
        g: Number.parseInt(normalized.slice(2, 4), 16),
        b: Number.parseInt(normalized.slice(4, 6), 16),
    };
}

function darkenChannel(value: number, factor: number): number {
    return Math.max(0, Math.min(255, Math.round(value * factor)));
}

export function timesheetEntryColorStyles(hex: string): {
    backgroundColor: string;
    borderColor: string;
    color: string;
} {
    const { r, g, b } = hexToRgb(hex);

    return {
        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.18)`,
        borderColor: `rgba(${r}, ${g}, ${b}, 0.5)`,
        color: `rgb(${darkenChannel(r, 0.45)}, ${darkenChannel(g, 0.45)}, ${darkenChannel(b, 0.45)})`,
    };
}
