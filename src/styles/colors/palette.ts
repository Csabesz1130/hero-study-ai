import { SemanticColors, ColorPalette } from './types';
import { generateColorScale } from './utils';

// Alap színek
const baseColors = {
    primary: '#4CAF50',
    secondary: '#2196F3',
    accent: '#FFC107',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',
    neutral: '#9E9E9E',
};

// Szemantikus színek generálása
export const semanticColors: SemanticColors = {
    primary: generateColorScale(baseColors.primary),
    secondary: generateColorScale(baseColors.secondary),
    accent: generateColorScale(baseColors.accent),
    success: generateColorScale(baseColors.success),
    warning: generateColorScale(baseColors.warning),
    error: generateColorScale(baseColors.error),
    info: generateColorScale(baseColors.info),
    neutral: generateColorScale(baseColors.neutral),
};

// Színpaletta dokumentáció
export const colorPalettes: ColorPalette[] = [
    {
        name: 'Primary',
        description: 'Az alkalmazás elsődleges színe, fő CTA gombokhoz és fontos elemekhez',
        colors: semanticColors.primary,
        usage: [
            'Fő CTA gombok',
            'Navigációs elemek',
            'Fontos státuszjelzések',
        ],
        examples: [
            {
                component: 'Button',
                colors: ['primary.500', 'primary.600', 'primary.700'],
            },
            {
                component: 'Navigation',
                colors: ['primary.500', 'primary.600'],
            },
        ],
    },
    {
        name: 'Secondary',
        description: 'Másodlagos szín, kiegészítő elemekhez és alternatív CTA-khoz',
        colors: semanticColors.secondary,
        usage: [
            'Másodlagos gombok',
            'Információs kártyák',
            'Kiegészítő elemek',
        ],
        examples: [
            {
                component: 'Secondary Button',
                colors: ['secondary.500', 'secondary.600'],
            },
            {
                component: 'Info Card',
                colors: ['secondary.100', 'secondary.200'],
            },
        ],
    },
    {
        name: 'Success',
        description: 'Pozitív eredmények és sikeres műveletek jelzésére',
        colors: semanticColors.success,
        usage: [
            'Sikeres műveletek',
            'Pozitív visszajelzések',
            'Jóváhagyó gombok',
        ],
        examples: [
            {
                component: 'Success Alert',
                colors: ['success.500', 'success.100'],
            },
            {
                component: 'Success Button',
                colors: ['success.500', 'success.600'],
            },
        ],
    },
    {
        name: 'Warning',
        description: 'Figyelmeztetések és fontos üzenetek jelzésére',
        colors: semanticColors.warning,
        usage: [
            'Figyelmeztető üzenetek',
            'Fontos értesítések',
            'Várakozást igénylő műveletek',
        ],
        examples: [
            {
                component: 'Warning Alert',
                colors: ['warning.500', 'warning.100'],
            },
            {
                component: 'Warning Button',
                colors: ['warning.500', 'warning.600'],
            },
        ],
    },
    {
        name: 'Error',
        description: 'Hibák és negatív eredmények jelzésére',
        colors: semanticColors.error,
        usage: [
            'Hibaüzenetek',
            'Törlés gombok',
            'Negatív visszajelzések',
        ],
        examples: [
            {
                component: 'Error Alert',
                colors: ['error.500', 'error.100'],
            },
            {
                component: 'Delete Button',
                colors: ['error.500', 'error.600'],
            },
        ],
    },
    {
        name: 'Info',
        description: 'Tájékoztató üzenetek és információs elemek',
        colors: semanticColors.info,
        usage: [
            'Információs üzenetek',
            'Segítség szövegek',
            'Tippek és trükkök',
        ],
        examples: [
            {
                component: 'Info Alert',
                colors: ['info.500', 'info.100'],
            },
            {
                component: 'Tooltip',
                colors: ['info.500', 'info.600'],
            },
        ],
    },
    {
        name: 'Neutral',
        description: 'Semleges színek, háttér és szövegekhez',
        colors: semanticColors.neutral,
        usage: [
            'Háttérszínek',
            'Szövegek',
            'Semleges elemek',
        ],
        examples: [
            {
                component: 'Background',
                colors: ['neutral.50', 'neutral.100'],
            },
            {
                component: 'Text',
                colors: ['neutral.900', 'neutral.800'],
            },
        ],
    },
];

// CSS változók generálása
export const generateCSSVariables = (): string => {
    let css = ':root {\n';

    Object.entries(semanticColors).forEach(([name, scale]) => {
        Object.entries(scale).forEach(([level, color]) => {
            css += `  --${name}-${level}: ${color};\n`;
        });
    });

    css += '}';
    return css;
};

// Dark mode változók
export const generateDarkModeVariables = (): string => {
    let css = '@media (prefers-color-scheme: dark) {\n  :root {\n';

    Object.entries(semanticColors).forEach(([name, scale]) => {
        Object.entries(scale).forEach(([level, color]) => {
            // Dark mode-ban a világosabb színeket sötétebbre, a sötétebbeket világosabbra állítjuk
            const invertedLevel = String(1000 - parseInt(level));
            css += `    --${name}-${level}: var(--${name}-${invertedLevel});\n`;
        });
    });

    css += '  }\n}';
    return css;
}; 