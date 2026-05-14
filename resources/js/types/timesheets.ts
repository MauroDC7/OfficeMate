export type TimesheetEntryPayload = {
    id: number;
    title: string;
    description: string | null;
    client_name: string | null;
    worked_on: string;
    start_minutes: number;
    end_minutes: number;
};
