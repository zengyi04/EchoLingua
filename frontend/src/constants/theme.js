export const COLORS = {
  primary: '#4ECDC4',
  secondary: '#D08C60',
  accent: '#FFD93D',
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  error: '#EF4444',
  success: '#10B981',
  border: '#334155',
  glassLight: 'rgba(255, 255, 255, 0.1)',
  glassMedium: 'rgba(255, 255, 255, 0.08)',
  glassDark: 'rgba(0, 0, 0, 0.4)',
  glassOverlay: 'rgba(0, 0, 0, 0.6)',
  cardBackground: 'rgba(30, 41, 59, 0.8)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',
  inputBackground: 'rgba(15, 23, 42, 0.6)',
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
};

export const GLASS_EFFECTS = {
  light: {
    backgroundColor: COLORS.glassLight,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
  },
  medium: {
    backgroundColor: COLORS.glassMedium,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  dark: {
    backgroundColor: COLORS.glassDark,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
  },
};
