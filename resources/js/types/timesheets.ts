export type TimesheetEntryPayload = {
    id: number;
    title: string;
    description: string | null;
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
