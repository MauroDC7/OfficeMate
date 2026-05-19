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

export type EmployeeDashboardProps = {
    activeProjects: DashboardProject[];
    pendingTimesheetCount: number;
    hoursThisWeekMinutes: number;
    openLeaveDays: number;
    pendingLeaveRequestCount: number;
    weekStart: string;
    recentNotifications: DashboardNotification[];
};
