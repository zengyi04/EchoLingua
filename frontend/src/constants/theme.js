export const COLORS = {
  primary: '#2D6A4F', // Deep Borneo Forest Green
  secondary: '#D08C60', // Terracotta/Clay
  accent: '#E9C46A', // Gold/Sun
  background: '#F9F7F2', // Off-white/Paper
  surface: '#FFFFFF',
  text: '#1B4332',
  textSecondary: '#52796F',
  error: '#E76F51',
  success: '#2A9D8F',
  border: '#D8F3DC',
  // Glassmorphism colors
  glassLight: 'rgba(255, 255, 255, 0.7)',
  glassMedium: 'rgba(255, 255, 255, 0.5)',
  glassDark: 'rgba(255, 255, 255, 0.3)',
  glassOverlay: 'rgba(0, 0, 0, 0.05)',
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
  // In a real app, we would load custom fonts like 'Poppins' or 'Nunito' here
};

export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
};

// Glassmorphism effect presets
export const GLASS_EFFECTS = {
  light: {
    backgroundColor: COLORS.glassLight,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
  },
  medium: {
    backgroundColor: COLORS.glassMedium,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
  },
  dark: {
    backgroundColor: COLORS.glassDark,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
};