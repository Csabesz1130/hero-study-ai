import { useRef, useEffect, MutableRefObject } from 'react';

// Fókusz kezelés
export const useFocusTrap = (isOpen: boolean) => {
    const containerRef = useRef<HTMLElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement as HTMLElement;
            containerRef.current?.focus();

            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Tab') {
                    const focusableElements = containerRef.current?.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    ) as NodeListOf<HTMLElement>;

                    if (focusableElements.length === 0) return;

                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];

                    if (event.shiftKey) {
                        if (document.activeElement === firstElement) {
                            lastElement.focus();
                            event.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            firstElement.focus();
                            event.preventDefault();
                        }
                    }
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                previousFocusRef.current?.focus();
            };
        }
    }, [isOpen]);

    return containerRef;
};

// ARIA attribútumok
export const getAriaProps = (props: {
    id?: string;
    label?: string;
    description?: string;
    expanded?: boolean;
    pressed?: boolean;
    selected?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    hidden?: boolean;
}) => {
    return {
        'aria-label': props.label,
        'aria-describedby': props.description,
        'aria-expanded': props.expanded,
        'aria-pressed': props.pressed,
        'aria-selected': props.selected,
        'aria-disabled': props.disabled,
        'aria-required': props.required,
        'aria-invalid': props.invalid,
        'aria-hidden': props.hidden,
    };
};

// Billentyűzet navigáció
export const useKeyboardNavigation = (
    ref: MutableRefObject<HTMLElement | null>,
    options: {
        onEnter?: () => void;
        onEscape?: () => void;
        onArrowUp?: () => void;
        onArrowDown?: () => void;
        onArrowLeft?: () => void;
        onArrowRight?: () => void;
        onHome?: () => void;
        onEnd?: () => void;
    }
) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!ref.current?.contains(document.activeElement)) return;

            switch (event.key) {
                case 'Enter':
                    options.onEnter?.();
                    break;
                case 'Escape':
                    options.onEscape?.();
                    break;
                case 'ArrowUp':
                    options.onArrowUp?.();
                    break;
                case 'ArrowDown':
                    options.onArrowDown?.();
                    break;
                case 'ArrowLeft':
                    options.onArrowLeft?.();
                    break;
                case 'ArrowRight':
                    options.onArrowRight?.();
                    break;
                case 'Home':
                    options.onHome?.();
                    break;
                case 'End':
                    options.onEnd?.();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [ref, options]);
};

// Csökkentett mozgás támogatás
export const useReducedMotion = () => {
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mediaQuery.matches);

        const handleChange = (event: MediaQueryListEvent) => {
            setReducedMotion(event.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return reducedMotion;
};

// Nagy kontraszt támogatás
export const useHighContrast = () => {
    const [highContrast, setHighContrast] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-contrast: high)');
        setHighContrast(mediaQuery.matches);

        const handleChange = (event: MediaQueryListEvent) => {
            setHighContrast(event.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return highContrast;
}; 