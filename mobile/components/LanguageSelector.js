import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LanguageContext, languages } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

const LanguageSelector = ({ containerStyle }) => {
  const { language, changeLanguage, t } = useContext(LanguageContext);

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.title}>{t('profile.language')}</Text>
      <View style={styles.languageOptions}>
        {Object.values(languages).map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageOption,
              language.code === lang.code && styles.selectedLanguage,
            ]}
            onPress={() => handleLanguageChange(lang.code)}
          >
            <Text
              style={[
                styles.languageText,
                language.code === lang.code && styles.selectedLanguageText,
              ]}
            >
              {lang.name}
            </Text>
            {language.code === lang.code && (
              <Ionicons name="checkmark-circle" size={20} color="#30bced" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  languageOptions: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  selectedLanguage: {
    backgroundColor: '#e6f7fd',
  },
  languageText: {
    fontSize: 15,
  },
  selectedLanguageText: {
    fontWeight: '600',
    color: '#30bced',
  },
});

export default LanguageSelector; 