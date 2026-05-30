import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

export type RowActionItem = {
    label: string;
    onClick: () => void;
    danger?: boolean;
};

type RowActionsMenuProps = {
    items: RowActionItem[];
    label?: string;
};

const MENU_WIDTH_PX = 176;
const VIEWPORT_PADDING_PX = 8;

function IconDots() {
    return (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="12" cy="5" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="12" cy="19" r="1.6" />
        </svg>
    );
}

export function RowActionsMenu({ items, label = 'Acties' }: RowActionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => {
        setIsOpen(false);
        setMenuPosition(null);
    }, []);

    const computeMenuPosition = useCallback(
        (menuHeight?: number) => {
            const trigger = triggerRef.current;

            if (trigger === null) {
                return null;
            }

            const triggerRect = trigger.getBoundingClientRect();
            const height = menuHeight ?? items.length * 40 + 8;
            const gap = 4;

            let top = triggerRect.bottom + gap;
            let left = triggerRect.right - MENU_WIDTH_PX;

            if (top + height > window.innerHeight - VIEWPORT_PADDING_PX) {
                top = triggerRect.top - gap - height;
            }

            left = Math.max(
                VIEWPORT_PADDING_PX,
                Math.min(left, window.innerWidth - MENU_WIDTH_PX - VIEWPORT_PADDING_PX),
            );

            top = Math.max(VIEWPORT_PADDING_PX, top);

            return { top, left };
        },
        [items.length],
    );

    const updateMenuPosition = useCallback(() => {
        const next = computeMenuPosition(menuRef.current?.offsetHeight);

        if (next !== null) {
            setMenuPosition(next);
        }
    }, [computeMenuPosition]);

    function openMenu() {
        const initial = computeMenuPosition();

        if (initial !== null) {
            setMenuPosition(initial);
        }

        setIsOpen(true);
    }

    useLayoutEffect(() => {
        if (!isOpen) {
            return;
        }

        updateMenuPosition();
    }, [isOpen, updateMenuPosition, items]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const onScrollOrResize = () => updateMenuPosition();

        window.addEventListener('resize', onScrollOrResize);
        window.addEventListener('scroll', onScrollOrResize, true);

        return () => {
            window.removeEventListener('resize', onScrollOrResize);
            window.removeEventListener('scroll', onScrollOrResize, true);
        };
    }, [isOpen, updateMenuPosition]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                close();
            }
        };

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, close]);

    if (items.length === 0) {
        return null;
    }

    const menu = isOpen ? (
            <>
                <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden
                    onClick={close}
                    className="fixed inset-0 z-[90] cursor-default bg-transparent"
                />
                <div
                    ref={menuRef}
                    role="menu"
                    style={{
                        position: 'fixed',
                        top: menuPosition?.top ?? 0,
                        left: menuPosition?.left ?? 0,
                        width: MENU_WIDTH_PX,
                        visibility: menuPosition !== null ? 'visible' : 'hidden',
                    }}
                    className="z-[100] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-xl ring-1 ring-black/5"
                >
                    {items.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                close();
                                item.onClick();
                            }}
                            className={cn(
                                'flex w-full items-center px-3 py-2.5 text-left text-sm transition',
                                item.danger
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-gray-700 hover:bg-gray-50',
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </>
        ) : null;

    return (
        <>
            <div className="flex justify-end">
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => (isOpen ? close() : openMenu())}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-label={label}
                    className={cn(
                        'rounded-md p-2 text-gray-400 transition',
                        'hover:bg-gray-100 hover:text-gray-700',
                        isOpen && 'bg-gray-100 text-gray-700',
                    )}
                >
                    <IconDots />
                </button>
            </div>

            {typeof document !== 'undefined' && menu !== null ? createPortal(menu, document.body) : null}
        </>
    );
}
