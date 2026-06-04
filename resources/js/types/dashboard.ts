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
import type { AdminDashboardPresenceSummary } from '@/types/presence';

export type EmployeeDashboardWeeklyStatus = {
    week_start: string;
    difficult_this_week: string | null;
    plans_next_week: string | null;
    reminder_due: boolean;
    ai_draft_available: boolean;
};

export type EmployeeDashboardProps = {
    activeProjects: DashboardProject[];
    actionCount: number;
    pendingTimesheetCount: number;
    hoursThisWeekMinutes: number;
    openLeaveDays: number;
    pendingLeaveRequestCount: number;
    weeklyStatus: EmployeeDashboardWeeklyStatus | null;
    weeklyStatusReminderDue: boolean;
    weekStart: string;
    myLeaveThisWeek: TeamLeaveItem[];
    teamLeaveToday: TeamLeaveItem[];
    taskAvailability: string | null;
    taskAvailabilityLabel: string | null;
    trackerIsConnected: boolean;
    hasOrganization: boolean;
};

export type AdminDashboardPendingLeave = {
    id: number;
    starts_on: string;
    ends_on: string;
    type_label: string;
    user: {
        id: number;
        name: string;
    };
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

export type AdminDashboardEmployeeNeedingEmploymentSetup = {
    id: number;
    name: string;
    email: string;
    joined_at: string;
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
    employmentSetupCount: number;
    employeesNeedingEmploymentSetup: AdminDashboardEmployeeNeedingEmploymentSetup[];
    presenceSummary: AdminDashboardPresenceSummary;
};
