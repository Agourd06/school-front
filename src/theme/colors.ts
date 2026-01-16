export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  tertiary: string;
  tertiaryForeground: string;
  surface: string;
  surfaceForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  success: string;
  warning: string;
  danger: string;
  border: string;
  card: string;
  heading: string;
  body: string;
}

export const defaultTheme: ThemeColors = {
  primary: '#F2791E', // Edusol Orange
  primaryForeground: '#ffffff',
  secondary: '#1D3867', // Edusol Blue
  secondaryForeground: '#ffffff',
  tertiary: '#F2791E', // Default tertiary (Edusol Orange) - used for small accent lines, dividers, underlines
  tertiaryForeground: '#1D3867', // Edusol Blue
  surface: '#f8fafc',
  surfaceForeground: '#1D3867', // Edusol Blue
  accent: '#F2791E', // Edusol Orange
  accentForeground: '#ffffff',
  muted: '#64748b',
  mutedForeground: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  border: '#F2791E', // Edusol Orange for input borders
  card: '#ffffff',
  heading: '#1D3867', // Edusol Blue
  body: '#1D3867', // Edusol Blue
};

const cssVarMap: Record<keyof ThemeColors, string> = {
  primary: '--color-primary',
  primaryForeground: '--color-primary-foreground',
  secondary: '--color-secondary',
  secondaryForeground: '--color-secondary-foreground',
  tertiary: '--color-tertiary',
  tertiaryForeground: '--color-tertiary-foreground',
  surface: '--color-surface',
  surfaceForeground: '--color-surface-foreground',
  accent: '--color-accent',
  accentForeground: '--color-accent-foreground',
  muted: '--color-muted',
  mutedForeground: '--color-muted-foreground',
  success: '--color-success',
  warning: '--color-warning',
  danger: '--color-danger',
  border: '--color-border',
  card: '--color-card',
  heading: '--color-heading',
  body: '--color-body',
};

export const mergeTheme = (overrides?: Partial<ThemeColors>): ThemeColors => ({
  ...defaultTheme,
  ...(overrides ?? {}),
});

export const applyThemeToDocument = (theme: ThemeColors) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  (Object.keys(cssVarMap) as Array<keyof ThemeColors>).forEach((key) => {
    root.style.setProperty(cssVarMap[key], theme[key]);
  });
};

