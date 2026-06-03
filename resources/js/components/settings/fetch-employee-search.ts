import { search as searchEmployees } from '@/routes/settings/employees';

export type EmployeeSearchResult = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    avatar: string | null;
    weekly_work_hours: number;
    annual_leave_days: number;
    employment_profile_id: number | null;
};

export async function fetchEmployeeSearch(query: string): Promise<EmployeeSearchResult[]> {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
        return [];
    }

    const url = searchEmployees.url({
        query: { q: trimmed },
    });

    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
    });

    if (!response.ok) {
        return [];
    }

    const data = (await response.json()) as { results?: EmployeeSearchResult[] };

    return Array.isArray(data.results) ? data.results : [];
}
