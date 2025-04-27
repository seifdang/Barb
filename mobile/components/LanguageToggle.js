import React, { useContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LanguageContext, languages } from '../context/LanguageContext';

const LanguageToggle = ({ darkMode = false }) => {
  const { language, changeLanguage } = useContext(LanguageContext);
  
  // Get the next language in rotation (en -> ar -> fr -> en)
  const getNextLanguage = () => {
    const languageCodes = Object.keys(languages);
    const currentIndex = languageCodes.indexOf(language.code);
    const nextIndex = (currentIndex + 1) % languageCodes.length;
    return languageCodes[nextIndex];
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => changeLanguage(getNextLanguage())}
    >
      <View style={styles.languageButton}>
        <Text style={[
          styles.languageCode,
          darkMode && styles.darkText
        ]}>
          {language.code.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
  },
  languageButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  languageCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  darkText: {
    color: '#fff',
  }
});

export default LanguageToggle; 