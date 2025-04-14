export type ColorScale = {
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
    950: string;
};

export type SemanticColors = {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    info: ColorScale;
    neutral: ColorScale;
};

export type ColorMode = 'light' | 'dark';

export type ColorBlindnessType =
    | 'protanopia'    // Vöröszínvakság
    | 'deuteranopia'  // Zöldszínvakság
    | 'tritanopia'    // Kékszínvakság
    | 'achromatopsia' // Teljes színvakság
    | 'none';

export type ColorContrast = {
    ratio: number;
    level: 'AAA' | 'AA' | 'AA-Large' | 'Fail';
    meetsRequirements: boolean;
};

export type ColorManipulation = {
    lighten: (color: string, amount: number) => string;
    darken: (color: string, amount: number) => string;
    saturate: (color: string, amount: number) => string;
    desaturate: (color: string, amount: number) => string;
    mix: (color1: string, color2: string, weight: number) => string;
    alpha: (color: string, opacity: number) => string;
};

export type ColorPalette = {
    name: string;
    description: string;
    colors: ColorScale;
    usage: string[];
    examples: {
        component: string;
        colors: string[];
    }[];
}; 