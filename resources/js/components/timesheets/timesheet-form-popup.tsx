import type { ReactNode } from 'react';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

import {
    durationMinutesFromTimeInputs,
    formatDurationMinutes,
} from '@/components/timesheets/timesheet-helpers';
import { TimesheetEntryColorPicker } from '@/components/timesheets/timesheet-entry-color-picker';
import {
    formatTimesheetProjectLabel,
} from '@/components/timesheets/timesheet-project-select';
import type {
    TimesheetDraft,
    TimesheetModalState,
    TimesheetPopoverAnchor,
} from '@/components/timesheets/week-calendar-types';
import { cn } from '@/lib/utils';
import type { TimesheetProjectOption } from '@/types/timesheets';

type TimesheetFormPopupProps = {
    modal: TimesheetModalState;
    draft: TimesheetDraft;
    projectOptions: TimesheetProjectOption[];
    trackerWindowTitles: string[];
    formError: string | null;
    serverErrors: Record<string, string>;
    submitting: boolean;
    onDraftChange: (field: keyof TimesheetDraft, value: string) => void;
    onClose: () => void;
    onSave: () => void;
    onDelete: () => void | Promise<void>;
    onDuplicate?: () => void;
};

const POPOVER_WIDTH_PX = 400;
const VIEWPORT_PADDING_PX = 12;
const ANCHOR_GAP_PX = 6;

function IconDuplicate({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
        >
            <rect
                x="8"
                y="8"
                width="12"
                height="12"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.75"
            />
            <path
                d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
            />
        </svg>
    );
}

function IconTrash({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
        >
            <path
                d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-7 4v6m4-6v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconClose({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
        >
            <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
            />
        </svg>
    );
}

function IconFolder({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
        >
            <path
                d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconArrowRight({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
        >
            <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function computePopoverPosition(
    anchor: TimesheetPopoverAnchor | undefined,
    popoverHeight: number,
): { top: number; left: number } {
    const maxLeft =
        window.innerWidth - POPOVER_WIDTH_PX - VIEWPORT_PADDING_PX;
    const maxTop =
        window.innerHeight - popoverHeight - VIEWPORT_PADDING_PX;

    if (anchor === undefined) {
        return {
            top: Math.max(
                VIEWPORT_PADDING_PX,
                Math.min(
                    (window.innerHeight - popoverHeight) / 2,
                    maxTop,
                ),
            ),
            left: Math.max(
                VIEWPORT_PADDING_PX,
                Math.min(
                    (window.innerWidth - POPOVER_WIDTH_PX) / 2,
                    maxLeft,
                ),
            ),
        };
    }

    let top = anchor.top - ANCHOR_GAP_PX;
    let left = anchor.right - POPOVER_WIDTH_PX + 12;

    if (top + popoverHeight > window.innerHeight - VIEWPORT_PADDING_PX) {
        top = anchor.bottom + ANCHOR_GAP_PX;
    }

    if (top < VIEWPORT_PADDING_PX) {
        top = Math.max(
            VIEWPORT_PADDING_PX,
            anchor.top - popoverHeight - ANCHOR_GAP_PX,
        );
    }

    left = Math.max(VIEWPORT_PADDING_PX, Math.min(left, maxLeft));
    top = Math.max(VIEWPORT_PADDING_PX, Math.min(top, maxTop));

    return { top, left };
}

function ToolbarIconButton({
    label,
    onClick,
    disabled,
    active,
    danger,
    children,
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    danger?: boolean;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            className={cn(
                'rounded-md p-1.5 transition disabled:cursor-not-allowed disabled:opacity-40',
                danger
                    ? 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                    : active
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700',
            )}
        >
            {children}
        </button>
    );
}

export function TimesheetFormPopup({
    modal,
    draft,
    projectOptions,
    trackerWindowTitles,
    formError,
    serverErrors,
    submitting,
    onDraftChange,
    onClose,
    onSave,
    onDelete,
    onDuplicate,
}: TimesheetFormPopupProps) {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(
        null,
    );
    const [descriptionFocused, setDescriptionFocused] = useState(false);
    const [projectOpen, setProjectOpen] = useState(false);

    const showWindowTitles =
        descriptionFocused && trackerWindowTitles.length > 0;
    const isEdit = modal.mode === 'edit';

    const durationMinutes = durationMinutesFromTimeInputs(draft.start, draft.end);
    const durationLabel =
        durationMinutes !== null
            ? formatDurationMinutes(0, durationMinutes)
            : '–';

    const selectedProject = projectOptions.find(
        (option) => String(option.id) === draft.projectId,
    );

    const updatePosition = useCallback(() => {
        const height = popoverRef.current?.offsetHeight ?? 320;

        setPosition(
            computePopoverPosition(modal.anchor, height),
        );
    }, [modal.anchor]);

    useLayoutEffect(() => {
        updatePosition();
    }, [updatePosition, draft, projectOpen, showWindowTitles, formError]);

    useEffect(() => {
        function onScrollOrResize(): void {
            updatePosition();
        }

        window.addEventListener('resize', onScrollOrResize);
        window.addEventListener('scroll', onScrollOrResize, true);

        return () => {
            window.removeEventListener('resize', onScrollOrResize);
            window.removeEventListener('scroll', onScrollOrResize, true);
        };
    }, [updatePosition]);

    useEffect(() => {
        if (!projectOpen) {
            return;
        }

        function onPointerDown(event: MouseEvent): void {
            const target = event.target;

            if (
                target instanceof Node &&
                popoverRef.current?.contains(target)
            ) {
                return;
            }

            setProjectOpen(false);
        }

        document.addEventListener('mousedown', onPointerDown);

        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [projectOpen]);

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <>
            <button
                type="button"
                tabIndex={-1}
                aria-hidden
                onClick={onClose}
                className="fixed inset-0 z-[9998] cursor-default bg-black/20"
            />
            <div
                ref={popoverRef}
                role="dialog"
                aria-modal="true"
                aria-label={
                    isEdit ? 'Timesheet bewerken' : 'Timesheet toevoegen'
                }
                style={{
                    position: 'fixed',
                    top: position?.top ?? 0,
                    left: position?.left ?? 0,
                    width: POPOVER_WIDTH_PX,
                    visibility: position !== null ? 'visible' : 'hidden',
                }}
                className="z-[9999] rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-2 px-4 py-2.5">
                    <div className="flex items-center gap-0.5">
                        {isEdit && onDuplicate !== undefined ? (
                            <ToolbarIconButton
                                label="Dupliceren"
                                disabled={submitting}
                                onClick={onDuplicate}
                            >
                                <IconDuplicate />
                            </ToolbarIconButton>
                        ) : null}
                        {isEdit ? (
                            <ToolbarIconButton
                                label="Verwijderen"
                                disabled={submitting}
                                danger
                                onClick={() => {
                                    void onDelete();
                                }}
                            >
                                <IconTrash />
                            </ToolbarIconButton>
                        ) : null}
                        <TimesheetEntryColorPicker
                            value={draft.color}
                            disabled={submitting}
                            onChange={(hex) => onDraftChange('color', hex)}
                        />
                    </div>
                    <ToolbarIconButton
                        label="Sluiten"
                        disabled={submitting}
                        onClick={onClose}
                    >
                        <IconClose />
                    </ToolbarIconButton>
                </div>

                <div className="space-y-2 px-4 pb-3">
                    <input
                        id="ts-title"
                        type="text"
                        value={draft.title}
                        onChange={(event) =>
                            onDraftChange('title', event.target.value)
                        }
                        placeholder="Titel"
                        autoComplete="off"
                        className="w-full border-0 bg-transparent p-0 text-base font-semibold text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                    />
                    {serverErrors.title !== undefined ? (
                        <p className="text-xs text-red-600">
                            {serverErrors.title}
                        </p>
                    ) : null}

                    <div
                        onFocusCapture={() => setDescriptionFocused(true)}
                        onBlurCapture={(event) => {
                            if (
                                !event.currentTarget.contains(
                                    event.relatedTarget as Node | null,
                                )
                            ) {
                                setDescriptionFocused(false);
                            }
                        }}
                    >
                        <textarea
                            id="ts-desc"
                            value={draft.description}
                            onChange={(event) =>
                                onDraftChange('description', event.target.value)
                            }
                            rows={3}
                            placeholder="(geen beschrijving)"
                            aria-describedby={
                                showWindowTitles ? 'ts-window-titles' : undefined
                            }
                            className="min-h-[4.5rem] w-full resize-y border-0 bg-transparent p-0 text-base leading-relaxed text-gray-600 placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                        />
                        {showWindowTitles ? (
                            <div
                                id="ts-window-titles"
                                className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2"
                            >
                                <p className="text-[0.65rem] font-medium text-gray-500">
                                    Vensters in deze periode
                                </p>
                                <ul className="mt-1 max-h-24 space-y-0.5 overflow-y-auto text-xs text-gray-700">
                                    {trackerWindowTitles.map((title) => (
                                        <li
                                            key={title}
                                            className="leading-snug break-words"
                                        >
                                            {title}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                        {serverErrors.description !== undefined ? (
                            <p className="text-xs text-red-600">
                                {serverErrors.description}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div
                    className={cn(
                        'border-t border-gray-100 px-4 py-2.5 transition-[min-height] duration-150',
                        projectOpen && 'min-h-[11.5rem] pb-3',
                    )}
                >
                    <div className="flex items-center gap-1">
                        <ToolbarIconButton
                            label="Project koppelen"
                            active={draft.projectId !== '' || projectOpen}
                            onClick={() => setProjectOpen((open) => !open)}
                        >
                            <IconFolder />
                        </ToolbarIconButton>
                        {selectedProject !== undefined ? (
                            <span className="min-w-0 truncate text-sm text-violet-700">
                                {formatTimesheetProjectLabel(selectedProject)}
                            </span>
                        ) : (
                            <span className="text-sm text-gray-400">
                                Geen project
                            </span>
                        )}
                    </div>

                    {projectOpen ? (
                        <div
                            role="listbox"
                            aria-label="Project kiezen"
                            className="mt-2 max-h-56 min-h-[9.5rem] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/80 py-1"
                        >
                            <button
                                type="button"
                                role="option"
                                aria-selected={draft.projectId === ''}
                                onClick={() => {
                                    onDraftChange('projectId', '');
                                    setProjectOpen(false);
                                }}
                                className={cn(
                                    'flex w-full px-3 py-2.5 text-left text-sm transition hover:bg-white',
                                    draft.projectId === ''
                                        ? 'bg-white font-medium text-violet-700'
                                        : 'text-gray-700',
                                )}
                            >
                                Geen project
                            </button>
                            {projectOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    role="option"
                                    aria-selected={
                                        draft.projectId === String(option.id)
                                    }
                                    onClick={() => {
                                        onDraftChange(
                                            'projectId',
                                            String(option.id),
                                        );
                                        setProjectOpen(false);
                                    }}
                                    className={cn(
                                        'flex w-full px-3 py-2.5 text-left text-sm transition hover:bg-white',
                                        draft.projectId === String(option.id)
                                            ? 'bg-white font-medium text-violet-700'
                                            : 'text-gray-700',
                                    )}
                                >
                                    {formatTimesheetProjectLabel(option)}
                                </button>
                            ))}
                        </div>
                    ) : null}
                    {serverErrors.project_id !== undefined ? (
                        <p className="mt-1 text-xs text-red-600">
                            {serverErrors.project_id}
                        </p>
                    ) : null}
                    {serverErrors.color !== undefined ? (
                        <p className="mt-1 text-xs text-red-600">
                            {serverErrors.color}
                        </p>
                    ) : null}
                </div>

                <div className="flex items-center gap-2.5 border-t border-gray-100 px-4 py-3">
                    <input
                        id="ts-start"
                        type="time"
                        value={draft.start}
                        onChange={(event) =>
                            onDraftChange('start', event.target.value)
                        }
                        className="w-24 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 tabular-nums focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    />
                    <IconArrowRight className="shrink-0 text-gray-400" />
                    <input
                        id="ts-end"
                        type="time"
                        value={draft.end}
                        onChange={(event) =>
                            onDraftChange('end', event.target.value)
                        }
                        className="w-24 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 tabular-nums focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    />
                    <span className="ms-auto shrink-0 text-sm font-medium text-gray-600 tabular-nums">
                        {durationLabel}
                    </span>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={submitting}
                        className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? '…' : 'Opslaan'}
                    </button>
                </div>

                {(serverErrors.start_minutes !== undefined ||
                    serverErrors.end_minutes !== undefined ||
                    serverErrors.worked_on !== undefined ||
                    formError !== null) && (
                    <div className="border-t border-gray-100 px-4 py-2">
                        {serverErrors.start_minutes !== undefined ||
                        serverErrors.end_minutes !== undefined ? (
                            <p className="text-xs text-red-600">
                                {serverErrors.start_minutes ??
                                    serverErrors.end_minutes}
                            </p>
                        ) : null}
                        {serverErrors.worked_on !== undefined ? (
                            <p className="text-xs text-red-600">
                                {serverErrors.worked_on}
                            </p>
                        ) : null}
                        {formError !== null ? (
                            <p className="text-xs text-red-600">{formError}</p>
                        ) : null}
                    </div>
                )}
            </div>
        </>,
        document.body,
    );
}
