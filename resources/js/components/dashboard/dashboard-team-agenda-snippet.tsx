import { TeamLeaveOverview } from '@/components/leave-requests/team-leave-overview';
import type { TeamLeaveItem } from '@/types/leave-requests';

type DashboardTeamAgendaSnippetProps = {
    teamLeaveThisWeek: TeamLeaveItem[];
    hasOrganization: boolean;
};

export function DashboardTeamAgendaSnippet({
    teamLeaveThisWeek,
    hasOrganization,
}: DashboardTeamAgendaSnippetProps) {
    return (
        <TeamLeaveOverview
            title="Team & agenda"
            description="Goedgekeurd verlof van collega’s deze week."
            items={teamLeaveThisWeek}
            hasOrganization={hasOrganization}
            emptyMessage="Geen collega’s met goedgekeurd verlof deze week."
        />
    );
}
