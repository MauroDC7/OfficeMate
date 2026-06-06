export const dashboardSnapshotCardClassName =
    'block rounded-xl border border-gray-200 border-s-4 border-s-red-600 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900';

export const dashboardSectionClassName =
    'rounded-xl border border-gray-200 border-s-4 border-s-red-600 bg-white shadow-sm';

export const dashboardSectionLinkClassName =
    'inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50';

export const feedbackToastBaseClassName =
    'rounded-lg border border-gray-200 border-s-4 bg-white text-gray-900 shadow-md';

export const feedbackToastVariantClassName = {
    success: `${feedbackToastBaseClassName} border-s-emerald-600`,
    error: `${feedbackToastBaseClassName} border-s-red-600`,
    info: `${feedbackToastBaseClassName} border-s-gray-400`,
    warning: `${feedbackToastBaseClassName} border-s-amber-500`,
} as const;
