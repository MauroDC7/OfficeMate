export type TimesheetProjectOption = {
    id: number;
    name: string;
    type: 'internal' | 'external';
    client_name: string | null;
};

export type TimesheetEntryPayload = {
    id: number;
    title: string;
    description: string | null;
    color: string;
    project_id: number | null;
    project_name: string | null;
    client_name: string | null;
    worked_on: string;
    start_minutes: number;
    end_minutes: number;
    /** Desktop-tracker window titles for this slot (edit dialog only). */
    tracker_window_titles: string[];
};

export type TimesheetProposalPayload = {
    id: number;
    title: string;
    description: string | null;
    project_id: number | null;
    project_name: string | null;
    client_name: string | null;
    worked_on: string;
    start_minutes: number;
    end_minutes: number;
};

export type TimesheetActivityItem = {
    id: number;
    title: string;
    worked_on: string;
    start_minutes: number;
    end_minutes: number;
    created_at: string;
    updated_at: string;
    kind: 'created' | 'updated';
};
