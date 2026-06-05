export type AdminTimesheetReportFilterOption = {
    id: number;
    name: string;
};

export type AdminTimesheetReportRow = {
    id: number;
    employee_name: string;
    worked_on: string;
    time_range: string;
    duration_label: string;
    title: string;
    project_name: string | null;
    client_name: string | null;
};

export type AdminTimesheetReportExportFormat = {
    value: string;
    label: string;
    available: boolean;
};

export type AdminTimesheetReportPageProps = {
    organizationName: string;
    filters: {
        starts_on: string;
        ends_on: string;
        user_id: number | null;
        project_id: number | null;
        team_id: number | null;
    };
    filterOptions: {
        employees: AdminTimesheetReportFilterOption[];
        projects: AdminTimesheetReportFilterOption[];
        teams: AdminTimesheetReportFilterOption[];
    };
    summary: {
        entry_count: number;
        total_minutes: number;
        employee_count: number;
    };
    rows: AdminTimesheetReportRow[];
    exportFormats: AdminTimesheetReportExportFormat[];
};
