import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightTheme, CustomDarkTheme } from '../theme';
import { Appearance } from 'react-native';

export const ThemeContext = createContext({
  theme: LightTheme,
  isDarkMode: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(LightTheme);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Charger la préférence au démarrage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedPref = await AsyncStorage.getItem('themePreference');
        if (storedPref === 'dark') {
          setIsDarkMode(true);
          setTheme(CustomDarkTheme);
        } else {
          setIsDarkMode(false);
          setTheme(LightTheme);
        }
      } catch (e) {
        console.warn('Erreur chargement thème', e);
      }
    };
    loadTheme();

    // Écouteur du mode système
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      const systemDark = colorScheme === 'dark';
      setIsDarkMode(systemDark);
      setTheme(systemDark ? CustomDarkTheme : LightTheme);
      AsyncStorage.setItem('themePreference', systemDark ? 'dark' : 'light');
    });

    return () => sub.remove();
  }, []);

  // Basculement manuel
  const toggleTheme = async () => {
    const newDark = !isDarkMode;
    setIsDarkMode(newDark);
    setTheme(newDark ? CustomDarkTheme : LightTheme);
    await AsyncStorage.setItem('themePreference', newDark ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
