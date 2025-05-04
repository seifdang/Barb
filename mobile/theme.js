// theme.js
// Thème amélioré pour l'application de salon de coiffure (web et mobile)

import { DefaultTheme, MD3DarkTheme as PaperDarkTheme } from 'react-native-paper';


// Palette de couleurs
const colors = {
  primary: {
    light: '#0F4C75',
    dark: '#3282B8',
  },
  secondary: {
    light: '#3282B8',
    dark: '#0F4C75',
  },
  accent: {
    light: '#BBE1FA',
    dark: '#5DA3FA',
  },
  background: {
    light: '#F5F5F5',
    dark: '#1B262C',
  },
  surface: {
    light: '#FFFFFF',
    dark: '#222831',
  },
  text: {
    light: '#1B262C',
    dark: '#F5F5F5',
  },
  disabled: {
    light: '#C5C5C5',
    dark: '#6B6B6B',
  },
  placeholder: {
    light: '#A0A0A0',
    dark: '#8D8D8D',
  },
  backdrop: {
    light: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
  },
  notification: {
    light: '#FF4500',
    dark: '#FF6347',
  },
  success: {
    light: '#4CAF50',
    dark: '#81C784',
  },
  warning: {
    light: '#FFC107',
    dark: '#FFD54F',
  },
  error: {
    light: '#F44336',
    dark: '#E57373',
  },
};

// Thème clair
export const LightTheme = {
  ...DefaultTheme,
  dark: false,
  roundness: 8,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary.light,
    accent: colors.accent.light,
    background: colors.background.light,
    surface: colors.surface.light,
    text: colors.text.light,
    disabled: colors.disabled.light,
    placeholder: colors.placeholder.light,
    backdrop: colors.backdrop.light,
    notification: colors.notification.light,
    success: colors.success.light,
    warning: colors.warning.light,
    error: colors.error.light,
    secondary: colors.secondary.light,
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: { fontFamily: 'sans-serif', fontWeight: 'normal' },
    medium: { fontFamily: 'sans-serif-medium', fontWeight: '500' },
    light: { fontFamily: 'sans-serif-light', fontWeight: '300' },
    thin: { fontFamily: 'sans-serif-thin', fontWeight: '100' },
  },
  animation: { scale: 1.0 },
};

// Thème sombre personnalisé
export const DarkTheme = {
  ...PaperDarkTheme,
  dark: true,
  roundness: 8,
  colors: {
    ...PaperDarkTheme.colors,
    primary: colors.primary.dark,
    accent: colors.accent.dark,
    background: colors.background.dark,
    surface: colors.surface.dark,
    text: colors.text.dark,
    disabled: colors.disabled.dark,
    placeholder: colors.placeholder.dark,
    backdrop: colors.backdrop.dark,
    notification: colors.notification.dark,
    success: colors.success.dark,
    warning: colors.warning.dark,
    error: colors.error.dark,
    secondary: colors.secondary.dark,
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: { fontFamily: 'sans-serif', fontWeight: 'normal' },
    medium: { fontFamily: 'sans-serif-medium', fontWeight: '500' },
    light: { fontFamily: 'sans-serif-light', fontWeight: '300' },
    thin: { fontFamily: 'sans-serif-thin', fontWeight: '100' },
  },
  animation: { scale: 1.0 },
};

// Export général
export default {
  LightTheme,
   DarkTheme,
  colors,
};
