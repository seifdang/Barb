import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Avatar, TextInput, Button, Divider, List, Switch, ActivityIndicator, Card } from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/client';

const ProfileScreen = () => {
  const { userInfo, updateProfile, logout, isLoading } = useContext(AuthContext);
  const navigation = useNavigation();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userInfo?.name || '');
  const [email, setEmail] = useState(userInfo?.email || '');
  const [phone, setPhone] = useState(userInfo?.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  
  // Get salon info for managers and barbers
  const [salons, setSalons] = useState([]);
  const [loadingSalons, setLoadingSalons] = useState(false);
  
  // Fetch salons for managers and barbers
  useEffect(() => {
    if (userInfo && (userInfo.role === 'manager' || userInfo.role === 'barber')) {
      fetchSalons();
    }
  }, [userInfo]);
  
  const fetchSalons = async () => {
    try {
      setLoadingSalons(true);
      
      // Different endpoints based on role
      const endpoint = userInfo.role === 'manager' 
        ? '/manager/salons' 
        : `/users/barber/${userInfo._id}/salons`;
      
      const response = await apiClient.get(endpoint, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });
      
      if (response.data && response.data.success) {
        setSalons(response.data.salons || []);
      } else {
        console.error('Failed to load salons:', response.data);
      }
      
      setLoadingSalons(false);
    } catch (error) {
      console.error('Error fetching salons:', error);
      setLoadingSalons(false);
    }
  };
  
  const handleSaveProfile = async () => {
    // Validate input
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    if (password && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    try {
      const userData = {
        name,
        phone,
      };
      
      // Only include password if it was updated
      if (password) {
        userData.password = password;
      }
      
      // Email can't be updated in this version
      // userData.email = email;
      
      const result = await updateProfile(userData);
      
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setIsEditing(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error('Profile update error:', error);
    }
  };
  
  const handleLogout = () => {
    // Show immediate feedback
    setLoggingOut(true);
    
    // Skip the context logout and directly handle it
    try {
      // Clear only the essential auth keys, don't touch other app settings
      const keysToRemove = ['userInfo', 'userToken'];
      
      AsyncStorage.multiRemove(keysToRemove, (err) => {
        if (err) {
          console.error('Error removing keys:', err);
        } else {
          console.log('Successfully removed keys');
        }
        
        // In any case, try to navigate away
        try {
          // Use the more direct navigation first
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }]
          });
        } catch (navError) {
          console.error('Navigation reset error:', navError);
          
          // Fallback to simpler navigation
          try {
            navigation.navigate('Login');
          } catch (navError2) {
            console.error('Navigation error:', navError2);
          }
        }
      });
    } catch (error) {
      console.error('General logout error:', error);
      // Still try to navigate away even if there was an error
      navigation.navigate('Login');
    }
  };
  
  if (!userInfo) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F4C75" />
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Image 
          size={100} 
          source={{ uri: userInfo.profileImage || 'https://via.placeholder.com/100' }} 
          style={styles.avatar}
        />
        <Text style={styles.name}>{userInfo.name}</Text>
        <Text style={styles.role}>{userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1)}</Text>
        
        {!isEditing && (
          <Button 
            mode="outlined" 
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        )}

        {/* Admin Dashboard Button - Only show for admin users or specific email */}
        {userInfo.role === 'admin' || userInfo.email === 'seif.ayadi.3.9.2@gmail.com' ? (
          <Button 
            mode="contained" 
            style={styles.adminButton}
            onPress={() => navigation.navigate('AdminDashboard')}
          >
            Admin Dashboard
          </Button>
        ) : null}

        {/* Manager Dashboard Button - Only show for manager users */}
        {userInfo.role === 'manager' ? (
          <>
            <Button 
              mode="contained" 
              style={styles.adminButton}
              onPress={() => navigation.navigate('ManagerDashboard')}
            >
              Staff Dashboard
            </Button>
            <Button 
              mode="contained" 
              style={[styles.adminButton, { marginTop: 10 }]}
              onPress={() => navigation.navigate('SalonDashboard')}
            >
              Salon Dashboard
            </Button>
          </>
        ) : null}
      </View>
      
      <View style={styles.content}>
        {isEditing ? (
          <View style={styles.form}>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />
            
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              disabled
              // Email change is disabled in this version
            />
            
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
            />
            
            <TextInput
              label="New Password (leave blank to keep current)"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
            />
            
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
            />
            
            <View style={styles.buttonContainer}>
              <Button 
                mode="outlined" 
                onPress={() => {
                  setIsEditing(false);
                  setName(userInfo.name);
                  setEmail(userInfo.email);
                  setPhone(userInfo.phone || '');
                  setPassword('');
                  setConfirmPassword('');
                }}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              
              <Button 
                mode="contained" 
                onPress={handleSaveProfile}
                loading={isLoading}
                disabled={isLoading}
                style={styles.saveButton}
              >
                Save
              </Button>
            </View>
          </View>
        ) : (
          <>
            <List.Section>
              <List.Subheader>Account Information</List.Subheader>
              <List.Item
                title="Email"
                description={userInfo.email}
                left={props => <List.Icon {...props} icon="email" />}
              />
              <List.Item
                title="Phone"
                description={userInfo.phone || 'Not provided'}
                left={props => <List.Icon {...props} icon="phone" />}
              />
              <Divider />
              
              <List.Subheader>Preferences</List.Subheader>
              <List.Item
                title="Notifications"
                left={props => <List.Icon {...props} icon="bell" />}
                right={() => (
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    color="#0F4C75"
                  />
                )}
              />
              <Divider />
              
              <List.Subheader>About</List.Subheader>
              <List.Item
                title="Terms of Service"
                left={props => <List.Icon {...props} icon="file-document" />}
                onPress={() => {}}
              />
              <List.Item
                title="Privacy Policy"
                left={props => <List.Icon {...props} icon="shield-account" />}
                onPress={() => {}}
              />
              <List.Item
                title="App Version"
                description="1.0.0"
                left={props => <List.Icon {...props} icon="information" />}
              />
            </List.Section>
          </>
        )}
        
        {/* Salon Section - Only for managers and barbers */}
        {userInfo && (userInfo.role === 'manager' || userInfo.role === 'barber') && (
          <Card style={styles.card}>
            <Card.Title title="Your Salons" />
            <Card.Content>
              {loadingSalons ? (
                <ActivityIndicator size="small" color="#0F4C75" />
              ) : salons.length > 0 ? (
                <View>
                  {salons.map((salon) => (
                    <TouchableOpacity 
                      key={salon._id}
                      onPress={() => navigation.navigate('SalonDashboard', { salonId: salon._id })}
                      style={styles.salonItem}
                    >
                      <View style={styles.salonInfo}>
                        <Text style={styles.salonName}>{salon.name}</Text>
                        <Text style={styles.salonAddress}>
                          {salon.address?.street}, {salon.address?.city}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#888" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text>No salons associated with your account</Text>
              )}
            </Card.Content>
          </Card>
        )}
        
        <TouchableOpacity
          style={styles.directLogoutButton}
          activeOpacity={0.6}
          onPress={() => {
            console.log("FORCE LOGOUT - no navigation approach");
            
            // 1. Clear storage directly
            AsyncStorage.clear();
            
            // 2. For web - force reload the app which will show login screen
            if (typeof window !== 'undefined') {
              console.log("Reloading browser");
              window.location.reload();
              return;
            }
            
            // 3. For native - trigger a state update in parent components
            if (logout) {
              logout();
            }
            
            // 4. Alert the user as a last resort
            Alert.alert(
              "Logout Complete", 
              "Please restart the app to complete logout",
              [{ text: "OK" }]
            );
          }}
        >
          <Text style={styles.logoutButtonText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
  },
  avatar: {
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B262C',
  },
  role: {
    fontSize: 16,
    color: '#3282B8',
    marginBottom: 10,
  },
  editButton: {
    marginVertical: 10,
    borderColor: '#0F4C75',
    borderWidth: 1,
  },
  adminButton: {
    marginTop: 10,
    backgroundColor: '#0F4C75',
  },
  content: {
    padding: 15,
  },
  form: {
    marginVertical: 10,
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
  },
  saveButton: {
    flex: 1,
    marginLeft: 10,
  },
  logoutButton: {
    marginVertical: 30,
    borderColor: '#d32f2f',
    borderWidth: 1,
  },
  directLogoutButton: {
    marginVertical: 30,
    borderColor: '#d32f2f',
    borderWidth: 1,
    backgroundColor: '#d32f2f',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    marginTop: 10,
  },
  salonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  salonInfo: {
    flex: 1,
  },
  salonName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  salonAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
});

export default ProfileScreen; 