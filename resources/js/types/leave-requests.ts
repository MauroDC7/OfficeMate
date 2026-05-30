export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export type LeaveType = 'vacation' | 'sick' | 'personal' | 'other';

export type LeaveRequestListItem = {
    id: number;
    starts_on: string;
    ends_on: string;
    status: LeaveRequestStatus;
    type: LeaveType;
    type_label: string;
    notes: string | null;
    day_count: number;
    created_at: string;
    can_edit: boolean;
};

export type LeaveRequestsPageStats = {
    openLeaveDays: number;
    pendingCount: number;
    approvedUpcomingCount: number;
};

export type LeaveRequestsPageProps = {
    stats: LeaveRequestsPageStats;
    requests: LeaveRequestListItem[];
};
