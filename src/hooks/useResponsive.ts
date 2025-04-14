import { useEffect, useState } from 'react';

// Tailwind alapértelmezett breakpoint-ok
export const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

type Breakpoint = keyof typeof breakpoints;

export const useResponsive = () => {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isBreakpoint = (breakpoint: Breakpoint) => {
        return windowSize.width >= breakpoints[breakpoint];
    };

    const isMobile = windowSize.width < breakpoints.sm;
    const isTablet = windowSize.width >= breakpoints.sm && windowSize.width < breakpoints.lg;
    const isDesktop = windowSize.width >= breakpoints.lg;

    return {
        windowSize,
        isBreakpoint,
        isMobile,
        isTablet,
        isDesktop,
    };
};

export const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [matches, query]);

    return matches;
};

export const useReducedMotion = () => {
    return useMediaQuery('(prefers-reduced-motion: reduce)');
};

export const useHighContrast = () => {
    return useMediaQuery('(prefers-contrast: high)');
};

export const useDarkMode = () => {
    return useMediaQuery('(prefers-color-scheme: dark)');
}; 