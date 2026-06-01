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
    } | null;
    taskAvailability: string | null;
    taskAvailabilityOptions: { value: string; label: string }[];
};
