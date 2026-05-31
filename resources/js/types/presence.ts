import type { UserAvatarFields } from '@/components/user-avatar';

export type PresenceStatus =
    | 'in_office'
    | 'out_of_office'
    | 'vacation'
    | 'sick'
    | 'other_leave';

export type PresenceSummary = {
    in_office: number;
    out_of_office: number;
    vacation: number;
    sick: number;
    other_leave: number;
};

export type PresenceEmployee = UserAvatarFields & {
    id: number;
    email: string;
    teams: string[];
    status: PresenceStatus;
    status_label: string;
    leave_ends_on: string | null;
};

export type AdminDashboardPresenceSummary = PresenceSummary;
