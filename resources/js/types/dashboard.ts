export type DashboardProject = {
    id: number;
    name: string;
    client_name: string | null;
};

export type DashboardNotification = {
    id: string;
    title: string;
    message: string;
    created_at: string;
};

import type { TeamLeaveItem } from '@/types/leave-requests';

export type EmployeeDashboardProps = {
    activeProjects: DashboardProject[];
    pendingTimesheetCount: number;
    hoursThisWeekMinutes: number;
    openLeaveDays: number;
    pendingLeaveRequestCount: number;
    weekStart: string;
    teamLeaveThisWeek: TeamLeaveItem[];
    hasOrganization: boolean;
    recentNotifications: DashboardNotification[];
};

export type AdminDashboardPendingMembership = {
    id: number;
    team: {
        id: number;
        name: string;
    };
    user: {
        id: number;
        name: string;
        email: string;
    };
};

export type AdminDashboardPendingLeave = {
    id: number;
    starts_on: string;
    ends_on: string;
    day_count: number;
    type: string;
    type_label: string;
    notes: string | null;
    attachment: { name: string; url: string } | null;
    user: {
        id: number;
        name: string;
        email: string;
    };
};

export type AdminDashboardCurrentLeave = {
    id: number;
    starts_on: string;
    ends_on: string;
    type: string;
    type_label: string;
    user: {
        id: number;
        name: string;
    };
};

export type AdminDashboardProps = {
    organizationName: string;
    memberCount: number;
    teamCount: number;
    pendingMembershipCount: number;
    pendingLeaveRequestCount: number;
    pendingProposalCount: number;
    openInviteCount: number;
    hoursThisWeekMinutes: number;
    weekStart: string;
    pendingMemberships: AdminDashboardPendingMembership[];
    pendingLeaveRequests: AdminDashboardPendingLeave[];
    currentLeave: AdminDashboardCurrentLeave[];
};
