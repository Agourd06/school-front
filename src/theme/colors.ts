export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
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
  primary: '#2563eb',
  primaryForeground: '#ffffff',
  secondary: '#0ea5e9',
  secondaryForeground: '#ffffff',
  surface: '#f8fafc',
  surfaceForeground: '#0f172a',
  accent: '#9333ea',
  accentForeground: '#ffffff',
  muted: '#64748b',
  mutedForeground: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  border: '#e2e8f0',
  card: '#ffffff',
  heading: '#0f172a',
  body: '#1f2937',
};

const cssVarMap: Record<keyof ThemeColors, string> = {
  primary: '--color-primary',
  primaryForeground: '--color-primary-foreground',
  secondary: '--color-secondary',
  secondaryForeground: '--color-secondary-foreground',
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

