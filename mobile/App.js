import React, { useState, useEffect, useContext, useRef, createRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Provider as PaperProvider } from 'react-native-paper';

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

// Components
import DisplaySettings from './components/DisplaySettings';

// Context
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom theme
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

// Bottom Tab Navigator for Customer
const CustomerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Services') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Appointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

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

// Bottom Tab Navigator for Admin
const AdminTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Services') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Appointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboardScreen} 
        options={{ title: 'Admin Dashboard' }}
      />
      <Tab.Screen name="Services" component={ServicesScreen} />
      <Tab.Screen name="Appointments" component={BarberAppointmentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Bottom Tab Navigator for Barber
const BarberTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Appointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={BarberDashboardScreen} 
        options={{ title: 'My Schedule' }}
      />
      <Tab.Screen 
        name="Appointments" 
        component={BarberAppointmentsScreen} 
        options={{ title: 'Appointments' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Bottom Tab Navigator for Manager
const ManagerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Services') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Appointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={ManagerDashboardScreen} 
        options={{ title: 'Manager Dashboard' }}
      />
      <Tab.Screen name="Services" component={ServicesScreen} />
      <Tab.Screen name="Appointments" component={BarberAppointmentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Auth Stack
const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// Auth Navigator Component that manages the auth state
const AuthNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { userToken, userInfo } = useContext(AuthContext);
  const [userRole, setUserRole] = useState('customer');

  // Check login status whenever userToken changes
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem('userToken');
        const userInfoString = await AsyncStorage.getItem('userInfo');
        console.log('Auth check - token present:', !!token);
        console.log('Auth check - userInfo present:', !!userInfoString);
        
        // Only consider logged in if BOTH token and userInfo exist
        const isLoggedInStatus = !!(token && userInfoString);
        setIsLoggedIn(isLoggedInStatus);
        
        // Get user role from userInfo
        if (isLoggedInStatus && userInfoString) {
          const userInfoObj = JSON.parse(userInfoString);
          setUserRole(userInfoObj.role || 'customer');
          console.log('User role set to:', userInfoObj.role || 'customer');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, [userToken, userInfo]); // Re-run when either userToken or userInfo changes

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  // Select the appropriate main component based on user role
  const getMainComponent = () => {
    switch (userRole) {
      case 'admin':
        return AdminTabs;
      case 'manager':
        return ManagerTabs;
      case 'barber':
        return BarberTabs;
      default:
        return CustomerTabs;
    }
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <Stack.Screen name="Main" component={getMainComponent()} />
      )}
      <Stack.Screen 
        name="Booking" 
        component={BookingScreen} 
        options={{ headerShown: true, title: 'Book Appointment' }} 
      />
      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen} 
        options={{ headerShown: true, title: 'Admin Dashboard' }} 
      />
      <Stack.Screen 
        name="ManagerDashboard" 
        component={ManagerDashboardScreen} 
        options={{ headerShown: true, title: 'Manager Dashboard' }} 
      />
      <Stack.Screen 
        name="BarberAppointments" 
        component={BarberAppointmentsScreen} 
        options={{ headerShown: true, title: 'Appointments' }} 
      />
      <Stack.Screen 
        name="SalonDetails" 
        component={SalonDetailsScreen} 
        options={{ headerShown: true, title: 'Edit Salon' }} 
      />
      <Stack.Screen 
        name="SalonStaff" 
        component={SalonStaffScreen} 
        options={{ headerShown: true, title: 'Salon Staff' }} 
      />
      <Stack.Screen 
        name="SalonDashboard" 
        component={SalonDashboardScreen} 
        options={{ headerShown: true, title: 'Salon Dashboard' }} 
      />
    </Stack.Navigator>
  );
};

// Main App
export default function App() {
  return (
    <ThemeProvider>
      <ThemeContext.Consumer>
        {({ theme, isDarkMode }) => (
          <AuthProvider>
            <PaperProvider theme={theme}>
              <NavigationContainer ref={navigationRef} theme={theme}>
                <StatusBar style={isDarkMode ? "light" : "dark"} />
                <AuthNavigator />
              </NavigationContainer>
            </PaperProvider>
          </AuthProvider>
        )}
      </ThemeContext.Consumer>
    </ThemeProvider>
  );
}

// Helper function to navigate directly to a specific tab
// This is accessible globally via the navigation ref
export const navigationRef = createRef();

export function navigateToTab(tabName) {
  navigationRef.current?.navigate(tabName);
} 