import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Composant pour le sélecteur de thème (clair/sombre)
const ThemeToggle = ({ onToggle, isDarkMode }) => {
  const theme = useTheme();
  
  return (
    <View style={styles.themeToggleContainer}>
      <Ionicons name="sunny-outline" size={20} color={theme.colors.text} />
      <Switch
        value={isDarkMode}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: theme.colors.primary }}
        thumbColor={isDarkMode ? theme.colors.accent : '#f4f3f4'}
        style={styles.switch}
      />
      <Ionicons name="moon-outline" size={20} color={theme.colors.text} />
    </View>
  );
};

// Composant principal pour les paramètres d'affichage
const DisplaySettings = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { updateUserPreferences, userInfo } = useContext(AuthContext);
  const theme = useTheme();

  // Charger les préférences utilisateur au chargement
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const themePreference = await AsyncStorage.getItem('themePreference');
        if (themePreference !== null) {
          setIsDarkMode(themePreference === 'dark');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des préférences de thème:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Gérer le changement de thème
  const handleThemeToggle = async (value) => {
    setIsDarkMode(value);
    
    try {
      // Sauvegarder la préférence localement
      await AsyncStorage.setItem('themePreference', value ? 'dark' : 'light');
      
      // Si l'utilisateur est connecté, mettre à jour ses préférences sur le serveur
      if (userInfo && updateUserPreferences) {
        updateUserPreferences({ theme: value ? 'dark' : 'light' });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences de thème:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Paramètres d'affichage</Text>
      
      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Mode sombre</Text>
        <ThemeToggle onToggle={handleThemeToggle} isDarkMode={isDarkMode} />
      </View>
      
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.buttonText}>Appliquer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingLabel: {
    fontSize: 16,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    marginHorizontal: 10,
  },
  button: {
    marginTop: 30,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DisplaySettings;
