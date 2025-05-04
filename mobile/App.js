import React, { useState, useEffect, useContext, createRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Provider as PaperProvider } from 'react-native-paper';

// Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import HomeScreen from './screens/customer/HomeScreen';
import ServicesScreen from './screens/customer/ServicesScreen';
import BookingScreen from './screens/customer/BookingScreen';
import AppointmentsScreen from './screens/customer/AppointmentsScreen';
import ProfileScreen from './screens/customer/ProfileScreen';
import BarberAppointmentsScreen from './screens/barber/BarberAppointmentsScreen';
import BarberDashboardScreen from './screens/barber/BarberDashboardScreen';
import AdminDashboardScreen from './screens/admin/DashboardScreen';
import SalonDetailsScreen from './screens/admin/SalonDetailsScreen';
import SalonStaffScreen from './screens/admin/SalonStaffScreen';
import ManagerDashboardScreen from './screens/manager/DashboardScreen';
import SalonDashboardScreen from './screens/manager/SalonDashboardScreen';

// Contexts
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';

// Themes
import { LightTheme, DarkTheme } from './theme';

export const navigationRef = createRef();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0F4C75',
    accent: '#3282B8',
    background: '#F5F5F5',
    text: '#1B262C',
  },
};

// --- Bottom Tab Navigators ---

const CustomerTabs = () => (
  <Tab.Navigator screenOptions={({ route }) => ({
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
  })}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Services" component={ServicesScreen} />
    <Tab.Screen name="Appointments" component={AppointmentsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator screenOptions={({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      let iconName;
      if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
      else if (route.name === 'Services') iconName = focused ? 'list' : 'list-outline';
      else if (route.name === 'Appointments') iconName = focused ? 'calendar' : 'calendar-outline';
      else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: 'gray',
    headerShown: false,
  })}>
    <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
    <Tab.Screen name="Services" component={ServicesScreen} />
    <Tab.Screen name="Appointments" component={BarberAppointmentsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const BarberTabs = () => (
  <Tab.Navigator screenOptions={({ route }) => ({
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
  })}>
    <Tab.Screen name="Dashboard" component={BarberDashboardScreen} />
    <Tab.Screen name="Appointments" component={BarberAppointmentsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const ManagerTabs = () => (
  <Tab.Navigator screenOptions={({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      let iconName;
      if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
      else if (route.name === 'Services') iconName = focused ? 'list' : 'list-outline';
      else if (route.name === 'Appointments') iconName = focused ? 'calendar' : 'calendar-outline';
      else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: 'gray',
    headerShown: false,
  })}>
    <Tab.Screen name="Dashboard" component={ManagerDashboardScreen} />
    <Tab.Screen name="Services" component={ServicesScreen} />
    <Tab.Screen name="Appointments" component={BarberAppointmentsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// --- Auth Stack ---
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// --- Auth Navigator ---
const AuthNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { userToken, userInfo } = useContext(AuthContext);
  const [userRole, setUserRole] = useState('customer');

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem('userToken');
        const userInfoString = await AsyncStorage.getItem('userInfo');
        const isLoggedInStatus = !!(token && userInfoString);
        setIsLoggedIn(isLoggedInStatus);

        if (isLoggedInStatus && userInfoString) {
          const userInfoObj = JSON.parse(userInfoString);
          setUserRole(userInfoObj.role || 'customer');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, [userToken, userInfo]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  const getMainComponent = () => {
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
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <Stack.Screen name="Main" component={getMainComponent()} />
      )}
      <Stack.Screen name="Booking" component={BookingScreen} options={{ headerShown: true, title: 'Book Appointment' }} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: true, title: 'Admin Dashboard' }} />
      <Stack.Screen name="ManagerDashboard" component={ManagerDashboardScreen} options={{ headerShown: true, title: 'Manager Dashboard' }} />
      <Stack.Screen name="BarberAppointments" component={BarberAppointmentsScreen} options={{ headerShown: true, title: 'Appointments' }} />
      <Stack.Screen name="SalonDetails" component={SalonDetailsScreen} options={{ headerShown: true, title: 'Edit Salon' }} />
      <Stack.Screen name="SalonStaff" component={SalonStaffScreen} options={{ headerShown: true, title: 'Salon Staff' }} />
      <Stack.Screen name="SalonDashboard" component={SalonDashboardScreen} options={{ headerShown: true, title: 'Salon Dashboard' }} />
    </Stack.Navigator>
  );
};

// --- App Entry ---
export default function App() {
  return (
    <ThemeProvider>
      <ThemeContext.Consumer>
        {({ isDarkMode }) => {
          const appliedTheme = isDarkMode ? DarkTheme : LightTheme;
          return (
            <AuthProvider>
              <PaperProvider theme={appliedTheme}>
                <NavigationContainer ref={navigationRef} theme={appliedTheme}>
                  <StatusBar style={isDarkMode ? 'light' : 'dark'} />
                  <AuthNavigator />
                </NavigationContainer>
              </PaperProvider>
            </AuthProvider>
          );
        }}
      </ThemeContext.Consumer>
    </ThemeProvider>
  );
}

// --- Navigation Helper ---
export function navigateToTab(tabName) {
  navigationRef.current?.navigate(tabName);
}
