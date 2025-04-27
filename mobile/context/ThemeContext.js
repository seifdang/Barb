import React, { useState, useEffect, createContext } from 'react';
import { LightTheme, DarkTheme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Création du contexte de thème
export const ThemeContext = createContext();

// Provider du thème
export const ThemeProvider = ({ children }) => {
  // État pour le thème actuel
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(LightTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les préférences de thème au démarrage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        setIsLoading(true);
        const themePreference = await AsyncStorage.getItem('themePreference');
        
        if (themePreference === 'dark') {
          setIsDarkMode(true);
          setTheme(DarkTheme);
        } else {
          setIsDarkMode(false);
          setTheme(LightTheme);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des préférences de thème:', error);
        // Par défaut, utiliser le thème clair
        setIsDarkMode(false);
        setTheme(LightTheme);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Fonction pour basculer entre les thèmes
  const toggleTheme = async () => {
    try {
      const newIsDarkMode = !isDarkMode;
      setIsDarkMode(newIsDarkMode);
      setTheme(newIsDarkMode ? DarkTheme : LightTheme);
      
      // Sauvegarder la préférence
      await AsyncStorage.setItem('themePreference', newIsDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences de thème:', error);
    }
  };

  // Fonction pour définir un thème spécifique
  const setThemeMode = async (mode) => {
    try {
      const isDark = mode === 'dark';
      setIsDarkMode(isDark);
      setTheme(isDark ? DarkTheme : LightTheme);
      
      // Sauvegarder la préférence
      await AsyncStorage.setItem('themePreference', mode);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences de thème:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        toggleTheme,
        setThemeMode,
        isLoading
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
