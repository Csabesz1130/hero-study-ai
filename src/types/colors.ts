export type ColorBlindnessType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface ColorPalette {
    name: string;
    description: string;
    colors: {
        [key: string]: string;
    };
    usage: {
        primary: string[];
        secondary: string[];
        accent: string[];
    };
    components: {
        [key: string]: {
            name: string;
            colors: string[];
        };
    };
}

export interface SemanticColors {
    primary: {
        main: string;
        light: string;
        dark: string;
        contrast: string;
    };
    secondary: {
        main: string;
        light: string;
        dark: string;
        contrast: string;
    };
    accent: {
        main: string;
        light: string;
        dark: string;
        contrast: string;
    };
    neutral: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
    };
    success: {
        main: string;
        light: string;
        dark: string;
        contrast: string;
    };
    warning: {
        main: string;
        light: string;
        dark: string;
        contrast: string;
    };
    error: {
        main: string;
        light: string;
        dark: string;
        contrast: string;
    };
    info: {
        main: string;
        light: string;
        dark: string;
        contrast: string;
    };
} 