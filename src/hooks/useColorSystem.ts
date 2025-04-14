import { useState, useCallback } from 'react';
import { ColorBlindnessType, ColorPalette, SemanticColors } from '../types/colors';

export const useColorSystem = (initialPalette: ColorPalette) => {
    const [palette, setPalette] = useState<ColorPalette>(initialPalette);
    const [colorBlindness, setColorBlindness] = useState<ColorBlindnessType>('none');
    const [semanticColors, setSemanticColors] = useState<SemanticColors>({
        primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
            contrast: '#ffffff'
        },
        secondary: {
            main: '#9c27b0',
            light: '#ba68c8',
            dark: '#7b1fa2',
            contrast: '#ffffff'
        },
        accent: {
            main: '#ff4081',
            light: '#ff79b0',
            dark: '#c60055',
            contrast: '#ffffff'
        },
        neutral: {
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#eeeeee',
            300: '#e0e0e0',
            400: '#bdbdbd',
            500: '#9e9e9e',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121'
        },
        success: {
            main: '#4caf50',
            light: '#81c784',
            dark: '#388e3c',
            contrast: '#ffffff'
        },
        warning: {
            main: '#ff9800',
            light: '#ffb74d',
            dark: '#f57c00',
            contrast: '#ffffff'
        },
        error: {
            main: '#f44336',
            light: '#e57373',
            dark: '#d32f2f',
            contrast: '#ffffff'
        },
        info: {
            main: '#2196f3',
            light: '#64b5f6',
            dark: '#1976d2',
            contrast: '#ffffff'
        }
    });

    const updatePalette = useCallback((newPalette: ColorPalette) => {
        setPalette(newPalette);
    }, []);

    const updateColorBlindness = useCallback((type: ColorBlindnessType) => {
        setColorBlindness(type);
    }, []);

    const updateSemanticColors = useCallback((newColors: Partial<SemanticColors>) => {
        setSemanticColors(prev => ({
            ...prev,
            ...newColors
        }));
    }, []);

    const getColorForBlindness = useCallback((color: string): string => {
        if (colorBlindness === 'none') return color;

        // Színvakság szimuláció
        const rgb = hexToRgb(color);
        if (!rgb) return color;

        switch (colorBlindness) {
            case 'protanopia':
                return simulateProtanopia(rgb);
            case 'deuteranopia':
                return simulateDeuteranopia(rgb);
            case 'tritanopia':
                return simulateTritanopia(rgb);
            default:
                return color;
        }
    }, [colorBlindness]);

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    const rgbToHex = (r: number, g: number, b: number) => {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    };

    const simulateProtanopia = (rgb: { r: number, g: number, b: number }) => {
        const r = rgb.r * 0.567 + rgb.g * 0.433;
        const g = rgb.r * 0.558 + rgb.g * 0.442;
        const b = rgb.r * 0.0 + rgb.g * 0.242 + rgb.b * 0.758;
        return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
    };

    const simulateDeuteranopia = (rgb: { r: number, g: number, b: number }) => {
        const r = rgb.r * 0.625 + rgb.g * 0.375;
        const g = rgb.r * 0.7 + rgb.g * 0.3;
        const b = rgb.r * 0.0 + rgb.g * 0.3 + rgb.b * 0.7;
        return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
    };

    const simulateTritanopia = (rgb: { r: number, g: number, b: number }) => {
        const r = rgb.r * 0.95 + rgb.g * 0.05;
        const g = rgb.r * 0.0 + rgb.g * 0.433 + rgb.b * 0.567;
        const b = rgb.r * 0.0 + rgb.g * 0.475 + rgb.b * 0.525;
        return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
    };

    return {
        palette,
        colorBlindness,
        semanticColors,
        updatePalette,
        updateColorBlindness,
        updateSemanticColors,
        getColorForBlindness
    };
}; 