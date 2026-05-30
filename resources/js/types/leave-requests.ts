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

export type LeaveRequestBalance = {
    year: number;
    annual_days: number;
    used_days: number;
    pending_days: number;
    remaining_days: number;
};

export type LeaveRequestsPageProps = {
    balance: LeaveRequestBalance;
    stats: LeaveRequestsPageStats;
    requests: LeaveRequestListItem[];
};
