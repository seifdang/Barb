import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from '../translations';

// Define supported languages
export const languages = {
  en: { code: 'en', name: 'English', direction: 'ltr' },
  ar: { code: 'ar', name: 'العربية', direction: 'rtl' },
  fr: { code: 'fr', name: 'Français', direction: 'ltr' }
};

// Create the language context
export const LanguageContext = createContext();

// Translation resources
export const translations = {
  en: {
    // Common
    'app.name': 'BarberBook',
    'app.tagline': 'Book your next haircut with ease',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.book': 'Book',
    'common.confirm': 'Confirm',
    
    // Authentication
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.phone': 'Phone Number',
    'auth.logout': 'Logout',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': 'Don\'t have an account?',
    'auth.hasAccount': 'Already have an account?',
    
    // Home
    'home.greeting': 'Hello',
    'home.ready': 'Ready for a fresh cut?',
    'home.upcoming': 'Upcoming Appointments',
    'home.services': 'Our Services',
    'home.barbers': 'Our Barbers',
    'home.seeAll': 'See All',
    'home.emptyAppointment': 'You don\'t have any upcoming appointments.',
    'home.bookNow': 'Book Now',
    
    // Services
    'services.title': 'Our Services',
    'services.subtitle': 'Choose from our premium services',
    'services.search': 'Search services',
    'services.empty': 'No services match your search',
    'services.price': 'Price',
    'services.duration': 'Duration',
    'services.minutes': 'min',
    
    // Booking
    'booking.title': 'Book Appointment',
    'booking.selectBarber': 'Select Barber',
    'booking.selectDate': 'Select Date',
    'booking.selectTime': 'Select Time',
    'booking.noTimes': 'No available time slots for this date. Please select another date.',
    'booking.summary': 'Booking Summary',
    'booking.service': 'Service',
    'booking.barber': 'Barber',
    'booking.date': 'Date',
    'booking.time': 'Time',
    'booking.price': 'Price',
    'booking.confirm': 'Confirm Booking',
    'booking.success': 'Booking Successful',
    'booking.fail': 'Booking Failed',
    
    // Appointments
    'appointments.title': 'My Appointments',
    'appointments.upcoming': 'Upcoming',
    'appointments.past': 'Past',
    'appointments.date': 'Date',
    'appointments.time': 'Time',
    'appointments.barber': 'Barber',
    'appointments.service': 'Service',
    'appointments.status': 'Status',
    'appointments.cancel': 'Cancel Appointment',
    'appointments.cancelConfirm': 'Are you sure you want to cancel this appointment?',
    'appointments.emptyUpcoming': 'You don\'t have any upcoming appointments',
    'appointments.emptyPast': 'You don\'t have any past appointments',
    
    // Profile
    'profile.title': 'Profile',
    'profile.edit': 'Edit Profile',
    'profile.account': 'Account Information',
    'profile.preferences': 'Preferences',
    'profile.about': 'About',
    'profile.terms': 'Terms of Service',
    'profile.privacy': 'Privacy Policy',
    'profile.version': 'App Version',
    'profile.notifications': 'Notifications',
    'profile.language': 'Language',
    'profile.currency': 'Currency',
    
    // Salon
    'salon.nearby': 'Nearby Salons',
    'salon.distance': 'Distance',
    'salon.km': 'km',
    'salon.walkIn': 'Walk-in',
    'salon.queue': 'Current Queue',
    'salon.staffAvailable': 'Staff Available',
    'salon.chooseLocation': 'Choose Location',
    
    // Categories
    'category.all': 'All',
    'category.haircut': 'Haircut',
    'category.beard': 'Beard',
    'category.combo': 'Combo',
    'category.specialty': 'Specialty',
    'category.coloring': 'Coloring',
    'category.extensions': 'Extensions'
  },
  ar: {
    // Common
    'app.name': 'باربر بوك',
    'app.tagline': 'احجز قصة شعرك التالية بسهولة',
    'common.loading': 'جار التحميل...',
    'common.error': 'خطأ',
    'common.retry': 'إعادة المحاولة',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.book': 'حجز',
    'common.confirm': 'تأكيد',
    
    // Authentication
    'auth.login': 'تسجيل الدخول',
    'auth.register': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.name': 'الاسم الكامل',
    'auth.phone': 'رقم الهاتف',
    'auth.logout': 'تسجيل الخروج',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.noAccount': 'ليس لديك حساب؟',
    'auth.hasAccount': 'لديك حساب بالفعل؟',
    
    // Home
    'home.greeting': 'مرحبا',
    'home.ready': 'مستعد لقصة شعر جديدة؟',
    'home.upcoming': 'المواعيد القادمة',
    'home.services': 'خدماتنا',
    'home.barbers': 'الحلاقين لدينا',
    'home.seeAll': 'عرض الكل',
    'home.emptyAppointment': 'ليس لديك أي مواعيد قادمة.',
    'home.bookNow': 'احجز الآن',
    
    // Services
    'services.title': 'خدماتنا',
    'services.subtitle': 'اختر من خدماتنا الممتازة',
    'services.search': 'ابحث عن الخدمات',
    'services.empty': 'لا توجد خدمات تطابق بحثك',
    'services.price': 'السعر',
    'services.duration': 'المدة',
    'services.minutes': 'دقيقة',
    
    // Add other Arabic translations...
  },
  fr: {
    // Common
    'app.name': 'BarberBook',
    'app.tagline': 'Réservez votre prochaine coupe facilement',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.retry': 'Réessayer',
    'common.save': 'Sauvegarder',
    'common.cancel': 'Annuler',
    'common.yes': 'Oui',
    'common.no': 'Non',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.book': 'Réserver',
    'common.confirm': 'Confirmer',
    
    // Authentication
    'auth.login': 'Connexion',
    'auth.register': 'Inscription',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.name': 'Nom complet',
    'auth.phone': 'Numéro de téléphone',
    'auth.logout': 'Déconnexion',
    'auth.confirmPassword': 'Confirmer le mot de passe',
    'auth.forgotPassword': 'Mot de passe oublié?',
    'auth.noAccount': 'Vous n\'avez pas de compte?',
    'auth.hasAccount': 'Vous avez déjà un compte?',
    
    // Home
    'home.greeting': 'Bonjour',
    'home.ready': 'Prêt pour une nouvelle coupe?',
    'home.upcoming': 'Rendez-vous à venir',
    'home.services': 'Nos services',
    'home.barbers': 'Nos barbiers',
    'home.seeAll': 'Voir tout',
    'home.emptyAppointment': 'Vous n\'avez pas de rendez-vous à venir.',
    'home.bookNow': 'Réserver maintenant',
    
    // Add other French translations...
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(languages.en);
  const [loading, setLoading] = useState(true);

  // Load saved language preference
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('userLanguage');
        if (savedLanguage && languages[savedLanguage]) {
          setLanguage(languages[savedLanguage]);
        } else {
          // Default to device language or English
          setLanguage(languages.en);
        }
      } catch (error) {
        console.error('Failed to load language preference:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLanguage();
  }, []);

  // Function to change language
  const changeLanguage = async (languageCode) => {
    if (languages[languageCode]) {
      setLanguage(languages[languageCode]);
      try {
        await AsyncStorage.setItem('userLanguage', languageCode);
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  };

  // Translate function
  const t = (key, params = {}) => {
    // Check if translation exists
    if (!translations[language.code] || !translations[language.code][key]) {
      // Fallback to English if translation not found
      if (language.code !== 'en' && translations.en && translations.en[key]) {
        return applyParams(translations.en[key], params);
      }
      return key; // Return key if no translation found
    }
    
    return applyParams(translations[language.code][key], params);
  };

  // Helper function to replace parameters in translation strings
  const applyParams = (text, params) => {
    let result = text;
    Object.keys(params).forEach(param => {
      result = result.replace(`{{${param}}}`, params[param]);
    });
    return result;
  };

  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        changeLanguage, 
        t,
        isRTL: language.direction === 'rtl',
        loading 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}; 