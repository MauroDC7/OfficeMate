export type ProjectType = 'internal' | 'external';

export type ProjectStatus = 'in_progress' | 'on_hold' | 'waiting_for_client' | 'done';

export type ProjectMemberPreview = {
    id: number;
    name: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string | null;
};

export type OrganizationTeamOption = {
    id: number;
    name: string;
    department: string | null;
};

export type ProjectTeam = OrganizationTeamOption;

export type ProjectCard = {
    id: number;
    name: string;
    type: ProjectType;
    status: ProjectStatus;
    client_name: string | null;
    logo: string | null;
    hours_budget: number | null;
    tracked_minutes: number;
    member_count: number;
    members_preview: ProjectMemberPreview[];
    teams: ProjectTeam[];
};

export type ProjectCreatorOption = ProjectMemberPreview & {
    can_create_projects: boolean;
};

export type ProjectStats = {
    total_projects: number;
    tracked_hours_month: number;
    budget_utilization: number;
};

export type OrganizationSummary = {
    id: number;
    name: string;
};

export type ProjectShowDetail = {
    id: number;
    name: string;
    type: ProjectType;
    status: ProjectStatus;
    client_name: string | null;
    logo: string | null;
    hours_budget: number | null;
    is_active: boolean;
    created_at: string | null;
    creator: { id: number; name: string } | null;
};

export type ProjectHoursSummary = {
    tracked_minutes_total: number;
    tracked_minutes_week: number;
    tracked_minutes_month: number;
};

export type ProjectHoursByMember = {
    user: { id: number; name: string; avatar: string | null };
    tracked_minutes: number;
};

export type ProjectRecentEntry = {
    id: number;
    title: string;
    worked_on: string;
    start_minutes: number;
    end_minutes: number;
    duration_minutes: number;
    user: { id: number; name: string } | null;
};

export type ProjectPendingProposal = {
    id: number;
    title: string;
    worked_on: string;
    start_minutes: number;
    end_minutes: number;
    user: { id: number; name: string };
};

export type ProjectShowPageProps = {
    project: ProjectShowDetail;
    teams: ProjectTeam[];
    members: ProjectMemberPreview[];
    hours: ProjectHoursSummary;
    hours_by_member: ProjectHoursByMember[];
    recent_entries: ProjectRecentEntry[];
    pending_proposals: ProjectPendingProposal[];
    isAdmin: boolean;
    canUpdate: boolean;
    organizationTeams: OrganizationTeamOption[];
    projectCard: ProjectCard | null;
};

export type ProjectsPageProps = {
    organization: OrganizationSummary | null;
    projectCards: ProjectCard[];
    stats: ProjectStats;
    organizationTeams: OrganizationTeamOption[];
    organizationUsers: ProjectCreatorOption[];
    isAdmin: boolean;
    canCreate: boolean;
    awaitingOrganizationInvite: boolean;
    weeklyStatus: {
        week_start: string;
        difficult_this_week: string | null;
        plans_next_week: string | null;
        reminder_due: boolean;
        ai_draft_available: boolean;
    } | null;
    taskAvailability: string | null;
    taskAvailabilityOptions: { value: string; label: string }[];
};
