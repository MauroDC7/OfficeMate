import type { TimyPendingAction } from '@/types/timy';

type ChatbotPendingActionProps = {
    pendingAction: TimyPendingAction;
    isExecuting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export function ChatbotPendingActionCard({
    pendingAction,
    isExecuting,
    onConfirm,
    onCancel,
}: ChatbotPendingActionProps) {
    return (
        <div className="rounded-xl border border-gray-300 bg-white p-3.5 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Bevestigen
            </p>
            <p className="mt-1.5 text-sm font-medium text-gray-900">{pendingAction.summary}</p>
            <p className="mt-1 text-xs text-gray-500">
                Timy dient je verlofaanvraag in ter goedkeuring.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isExecuting}
                    className="inline-flex items-center rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isExecuting ? 'Bezig…' : 'Bevestigen'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isExecuting}
                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
                >
                    Annuleren
                </button>
            </div>
        </div>
    );
}
