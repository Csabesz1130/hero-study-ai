import { ColorManipulation, ColorContrast, ColorBlindnessType } from './types';

// RGB szín konverzió
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};

// Színmanipuláció
export const colorManipulation: ColorManipulation = {
    lighten: (color: string, amount: number): string => {
        const { r, g, b } = hexToRgb(color);
        return rgbToHex(
            Math.min(255, Math.round(r + (255 - r) * amount)),
            Math.min(255, Math.round(g + (255 - g) * amount)),
            Math.min(255, Math.round(b + (255 - b) * amount))
        );
    },

    darken: (color: string, amount: number): string => {
        const { r, g, b } = hexToRgb(color);
        return rgbToHex(
            Math.max(0, Math.round(r * (1 - amount))),
            Math.max(0, Math.round(g * (1 - amount))),
            Math.max(0, Math.round(b * (1 - amount)))
        );
    },

    saturate: (color: string, amount: number): string => {
        const { r, g, b } = hexToRgb(color);
        const max = Math.max(r, g, b);
        return rgbToHex(
            Math.min(255, Math.round(r + (max - r) * amount)),
            Math.min(255, Math.round(g + (max - g) * amount)),
            Math.min(255, Math.round(b + (max - b) * amount))
        );
    },

    desaturate: (color: string, amount: number): string => {
        const { r, g, b } = hexToRgb(color);
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        return rgbToHex(
            Math.round(r + (gray - r) * amount),
            Math.round(g + (gray - g) * amount),
            Math.round(b + (gray - b) * amount)
        );
    },

    mix: (color1: string, color2: string, weight: number): string => {
        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);
        return rgbToHex(
            Math.round(rgb1.r * weight + rgb2.r * (1 - weight)),
            Math.round(rgb1.g * weight + rgb2.g * (1 - weight)),
            Math.round(rgb1.b * weight + rgb2.b * (1 - weight))
        );
    },

    alpha: (color: string, opacity: number): string => {
        const { r, g, b } = hexToRgb(color);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
};

// Kontraszt ellenőrzés
export const checkContrast = (color1: string, color2: string): ColorContrast => {
    const getLuminance = (color: string): number => {
        const { r, g, b } = hexToRgb(color);
        const [rs, gs, bs] = [r, g, b].map(c => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    let level: ColorContrast['level'] = 'Fail';
    if (ratio >= 7) level = 'AAA';
    else if (ratio >= 4.5) level = 'AA';
    else if (ratio >= 3) level = 'AA-Large';

    return {
        ratio,
        level,
        meetsRequirements: level !== 'Fail',
    };
};

// Színvakság szimuláció
export const simulateColorBlindness = (color: string, type: ColorBlindnessType): string => {
    const { r, g, b } = hexToRgb(color);

    switch (type) {
        case 'protanopia':
            return rgbToHex(
                Math.round(0.567 * r + 0.433 * g),
                Math.round(0.558 * r + 0.442 * g),
                Math.round(0.242 * r + 0.758 * g)
            );
        case 'deuteranopia':
            return rgbToHex(
                Math.round(0.625 * r + 0.375 * g),
                Math.round(0.7 * r + 0.3 * g),
                Math.round(0.3 * r + 0.7 * g)
            );
        case 'tritanopia':
            return rgbToHex(
                Math.round(0.95 * r + 0.05 * g),
                Math.round(0.433 * g + 0.567 * b),
                Math.round(0.475 * g + 0.525 * b)
            );
        case 'achromatopsia':
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            return rgbToHex(gray, gray, gray);
        default:
            return color;
    }
};

// Színskála generálás
export const generateColorScale = (baseColor: string): ColorScale => {
    return {
        50: colorManipulation.lighten(baseColor, 0.9),
        100: colorManipulation.lighten(baseColor, 0.8),
        200: colorManipulation.lighten(baseColor, 0.6),
        300: colorManipulation.lighten(baseColor, 0.4),
        400: colorManipulation.lighten(baseColor, 0.2),
        500: baseColor,
        600: colorManipulation.darken(baseColor, 0.2),
        700: colorManipulation.darken(baseColor, 0.4),
        800: colorManipulation.darken(baseColor, 0.6),
        900: colorManipulation.darken(baseColor, 0.8),
        950: colorManipulation.darken(baseColor, 0.9),
    };
}; 