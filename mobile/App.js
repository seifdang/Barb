import React, { useState, useEffect, useContext, createRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper'; // <-- Added DefaultTheme import

// Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';

// Customer Screens
import HomeScreen from './screens/customer/HomeScreen';
import ServicesScreen from './screens/customer/ServicesScreen';
import BookingScreen from './screens/customer/BookingScreen';
import AppointmentsScreen from './screens/customer/AppointmentsScreen';
import ProfileScreen from './screens/customer/ProfileScreen';

// Barber Screens
import BarberAppointmentsScreen from './screens/barber/BarberAppointmentsScreen';
import BarberDashboardScreen from './screens/barber/BarberDashboardScreen';

// Admin Screens
import AdminDashboardScreen from './screens/admin/DashboardScreen';
import SalonDetailsScreen from './screens/admin/SalonDetailsScreen';
import SalonStaffScreen from './screens/admin/SalonStaffScreen';

// Manager Screens
import ManagerDashboardScreen from './screens/manager/DashboardScreen';
import SalonDashboardScreen from './screens/manager/SalonDashboardScreen';

// Context
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom fallback theme (if needed before context loads)
const baseTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0F4C75',
    accent: '#3282B8',
    background: '#F5F5F5',
    text: '#1B262C',
  },
};

// Navigator for Customer
const CustomerTabs = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Services') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Appointments') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Services" component={ServicesScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Navigator for Admin
const AdminTabs = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Salons') iconName = focused ? 'business' : 'business-outline';
          else if (route.name === 'Staff') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Salons" component={SalonDetailsScreen} />
      <Tab.Screen name="Staff" component={SalonStaffScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Navigator for Barber
const BarberTabs = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Appointments') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={BarberDashboardScreen} />
      <Tab.Screen name="Appointments" component={BarberAppointmentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Navigator for Manager
const ManagerTabs = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Salon') iconName = focused ? 'business' : 'business-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={ManagerDashboardScreen} />
      <Tab.Screen name="Salon" component={SalonDashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Auth Navigator
const AuthNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { userToken, userInfo } = useContext(AuthContext);
  const [userRole, setUserRole] = useState('customer');
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const info = await AsyncStorage.getItem('userInfo');
        const loggedIn = !!(token && info);
        setIsLoggedIn(loggedIn);
        if (loggedIn) {
          setUserRole(JSON.parse(info).role || 'customer');
        }
      } catch (e) {
        console.error('Auth check error', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkLogin();
  }, [userToken, userInfo]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  const MainComponent = () => {
    switch (userRole) {
      case 'admin': return AdminTabs;
      case 'manager': return ManagerTabs;
      case 'barber': return BarberTabs;
      default: return CustomerTabs;
    }
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainComponent()} />
      )}
      <Stack.Screen name="Booking" component={BookingScreen} options={{ headerShown: true, title: 'Book Appointment' }} />
      {/* ...other screens... */}
    </Stack.Navigator>
  );
};

// Main App
export const navigationRef = createRef();
export default function App() {
  return (
    <ThemeProvider>
      <ThemeContext.Consumer>
        {({ theme, isDarkMode }) => (
          <AuthProvider>
            <PaperProvider theme={theme || baseTheme}>
              <NavigationContainer ref={navigationRef} theme={theme || baseTheme}>
                <StatusBar style={isDarkMode ? 'light' : 'dark'} />
                <AuthNavigator />
              </NavigationContainer>
            </PaperProvider>
          </AuthProvider>
        )}
      </ThemeContext.Consumer>
    </ThemeProvider>
  );
}
