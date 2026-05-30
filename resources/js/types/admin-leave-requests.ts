import type { LeaveRequestStatus } from '@/types/leave-requests';

export type AdminLeaveRequestStatusFilter = 'all' | LeaveRequestStatus;

export type AdminLeaveRequestListItem = {
    id: number;
    starts_on: string;
    ends_on: string;
    status: LeaveRequestStatus;
    type: string;
    type_label: string;
    notes: string | null;
    rejection_reason: string | null;
    day_count: number;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    attachment: { name: string; url: string } | null;
    can_approve: boolean;
};

export type AdminLeaveRequestsPageProps = {
    organizationName: string;
    filters: {
        status: AdminLeaveRequestStatusFilter;
        search: string;
    };
    counts: {
        pending: number;
        approved: number;
        rejected: number;
    };
    requests: AdminLeaveRequestListItem[];
};
