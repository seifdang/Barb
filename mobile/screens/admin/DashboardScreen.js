import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, FlatList } from 'react-native';
import { Text, Card, Button, Title, Paragraph, FAB, Avatar, ActivityIndicator, Searchbar, Chip, Modal, Portal, TextInput, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';

const DashboardScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [salons, setSalons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [staffVisible, setStaffVisible] = useState(false);
  const [salonVisible, setSalonVisible] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'barber'
  });
  const [newSalonForm, setNewSalonForm] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: ''
    },
    phone: '',
    email: '',
    description: ''
  });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'barber',
    isActive: true
  });
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    totalUsers: 0,
    totalBarbers: 0,
    totalManagers: 0
  });

  // Check if user is admin
  useEffect(() => {
    if (userInfo && userInfo.email !== 'seif.ayadi.3.9.2@gmail.com') {
      Alert.alert('Access Denied', 'Only the admin account can access this screen.');
      navigation.goBack();
    } else {
      fetchUsers();
      fetchStats();
      fetchSalons();
    }
  }, [userInfo]);

  // Admin API endpoints
  const adminApi = {
    getUsers: () => apiClient.get('/admin/users'),
    createUser: (userData) => apiClient.post('/admin/users', userData),
    updateUser: (id, userData) => apiClient.put(`/admin/users/${id}`, userData),
    deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),
    getStats: () => apiClient.get('/admin/stats'),
    getSalons: () => apiClient.get('/admin/salons')
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Use our admin API endpoints instead of hardcoded data
      const response = await apiClient.get('/admin/users', {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });
      
      if (response.data && response.data.success) {
        const allUsers = response.data.users || [];
        setUsers(allUsers);
        setBarbers(allUsers.filter(u => u.role === 'barber'));
        setManagers(allUsers.filter(u => u.role === 'manager'));
        console.log(`Loaded ${allUsers.length} users, ${barbers.length} barbers, ${managers.length} managers`);
      } else {
        console.error('Failed to load users:', response.data);
        Alert.alert('Error', 'Failed to load users');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load users: ' + (error.message || 'Unknown error'));
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Use our admin stats API endpoint
      const response = await apiClient.get('/admin/stats', {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });
      
      if (response.data && response.data.success) {
        const { stats: apiStats } = response.data;
        
        setStats({
          totalAppointments: apiStats.appointments.total || 0,
          completedAppointments: apiStats.appointments.completed || 0,
          totalUsers: apiStats.users.total || 0,
          totalBarbers: apiStats.users.barbers || 0,
          totalManagers: apiStats.users.managers || 0
        });
        
        console.log('Dashboard stats loaded successfully');
      } else {
        console.error('Failed to load stats:', response.data);
        // Fallback to zeros if API fails
        setStats({
          totalAppointments: 0,
          completedAppointments: 0,
          totalUsers: 0,
          totalBarbers: 0,
          totalManagers: 0
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
      
      // Fallback to zeros if API fails
      setStats({
        totalAppointments: 0,
        completedAppointments: 0,
        totalUsers: 0,
        totalBarbers: 0,
        totalManagers: 0
      });
    }
  };

  // Fetch salons
  const fetchSalons = async () => {
    try {
      setLoading(true);
      
      const response = await apiClient.get('/admin/salons', {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });
      
      if (response.data && response.data.success) {
        const allSalons = response.data.salons || [];
        setSalons(allSalons);
        console.log(`Loaded ${allSalons.length} salons`);
      } else {
        console.error('Failed to load salons:', response.data);
        Alert.alert('Error', 'Failed to load salons');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching salons:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load salons: ' + (error.message || 'Unknown error'));
    }
  };

  // Create new user
  const handleCreateUser = async () => {
    try {
      setLoading(true);
      // Validate form
      if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
        Alert.alert('Error', 'Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Generate staff ID based on role and name
      const nameInitials = newUserForm.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();
      const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
      const rolePrefix = newUserForm.role === 'manager' ? 'MGR' : 'BRB';
      const staffId = `${rolePrefix}-${nameInitials}${randomNum}`;

      // Prepare the complete form data with staffId
      const completeFormData = {
        ...newUserForm,
        staffId,
        isActive: true,
        joinDate: new Date().toISOString()
      };

      console.log('Creating new staff with data:', JSON.stringify(completeFormData));
      
      // Get token from userInfo object
      const token = userInfo.token;
      
      // Make the API call with explicit token in header
      const response = await apiClient.post('/admin/users', completeFormData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('API response:', JSON.stringify(response.data));
      
      if (response.data && response.data.success) {
        console.log('Staff member created successfully:', response.data.user);
        // Fetch users again to get the updated list from server
        await fetchUsers();
        
        // Reset form
        setNewUserForm({
          name: '',
          email: '',
          password: '',
          phone: '',
          role: 'barber'
        });
        setStaffVisible(false);
        
        Alert.alert(
          'Success', 
          `${newUserForm.role === 'manager' ? 'Manager' : 'Barber'} added successfully with ID: ${staffId}`
        );
      } else {
        console.error('Failed to create staff member, response:', JSON.stringify(response.data));
        Alert.alert('Error', response.data?.message || 'Failed to create staff member');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error creating staff member:', error);
      console.error('Error details:', error.response?.data || error.message);
      setLoading(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create staff member. Check console for details.');
    }
  };

  // Handle user deletion
  const handleDeleteUser = (userId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this user?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Call the API to delete the user
              const response = await apiClient.delete(`/admin/users/${userId}`, {
                headers: {
                  Authorization: `Bearer ${userInfo.token}`
                }
              });
              
              if (response.data && response.data.success) {
                console.log('User deleted successfully:', response.data);
                // Refresh the user list
                await fetchUsers();
                Alert.alert('Success', 'User deleted successfully');
              } else {
                console.error('Failed to delete user:', response.data);
                Alert.alert('Error', response.data?.message || 'Failed to delete user');
              }
              
              setLoading(false);
            } catch (error) {
              console.error('Error deleting user:', error);
              setLoading(false);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  // Fetch user data for editing
  useEffect(() => {
    if (selectedUserId) {
      const userToEdit = users.find(user => user._id === selectedUserId);
      if (userToEdit) {
        setEditUserForm({
          name: userToEdit.name || '',
          email: userToEdit.email || '',
          phone: userToEdit.phone || '',
          role: userToEdit.role || 'barber',
          isActive: userToEdit.isActive !== undefined ? userToEdit.isActive : true
        });
      }
    }
  }, [selectedUserId]);

  // Handle user update
  const handleUpdateUser = async () => {
    try {
      setLoading(true);
      
      // Validate form
      if (!editUserForm.name || !editUserForm.email) {
        Alert.alert('Error', 'Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      console.log('Updating user with data:', JSON.stringify(editUserForm));
      
      // Get token from userInfo object
      const token = userInfo.token;
      
      // Make the API call with explicit token in header
      const response = await apiClient.put(`/admin/users/${selectedUserId}`, editUserForm, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        console.log('User updated successfully:', response.data.user);
        // Fetch users again to get the updated list
        await fetchUsers();
        
        // Reset form and close modal
        setSelectedUserId(null);
        
        Alert.alert('Success', 'User updated successfully');
      } else {
        console.error('Failed to update user, response:', JSON.stringify(response.data));
        Alert.alert('Error', response.data?.message || 'Failed to update user');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error updating user:', error);
      console.error('Error details:', error.response?.data || error.message);
      setLoading(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update user. Check console for details.');
    }
  };

  // Render user item
  const renderUserItem = ({ item }) => (
    <Card style={styles.userCard}>
      <Card.Content>
        <View style={styles.userCardHeader}>
          <Avatar.Text 
            size={40} 
            label={item.name.split(' ').map(n => n[0]).join('')} 
            backgroundColor="#0F4C75" 
          />
          <View style={styles.userInfo}>
            <Title>{item.name}</Title>
            <View style={styles.userDetailsRow}>
              <Paragraph style={styles.userEmail}>{item.email}</Paragraph>
              {item.phone && <Paragraph style={styles.userPhone}>• {item.phone}</Paragraph>}
            </View>
            {item.staffId && (
              <View style={styles.staffIdContainer}>
                <Paragraph style={styles.staffId}>ID: {item.staffId}</Paragraph>
                <Chip 
                  mode="flat" 
                  style={[styles.statusChip, {backgroundColor: item.isActive ? '#C8E6C9' : '#FFCDD2'}]}
                >
                  {item.isActive ? 'Active' : 'Inactive'}
                </Chip>
              </View>
            )}
          </View>
          <Chip mode="outlined" style={styles.roleChip}>
            {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
          </Chip>
        </View>
        <Divider style={{ marginVertical: 10 }} />
        <View style={styles.userCardActions}>
          <Button 
            mode="outlined" 
            compact 
            icon="pencil"
            onPress={() => setSelectedUserId(item._id)}
          >
            Edit
          </Button>
          <Button 
            mode="outlined" 
            compact 
            icon="delete" 
            textColor="#D32F2F"
            onPress={() => handleDeleteUser(item._id)}
          >
            Delete
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  // Create new salon
  const handleCreateSalon = async () => {
    try {
      setLoading(true);
      
      // Validate form
      if (!newSalonForm.name || !newSalonForm.address.street || !newSalonForm.address.city || !newSalonForm.phone) {
        Alert.alert('Error', 'Please fill in all required fields (name, address, phone)');
        setLoading(false);
        return;
      }
      
      // Create salon data with basic location
      const salonData = {
        ...newSalonForm,
        coordinates: [10.1815, 36.8065] // Default coordinates (Tunis)
      };
      
      console.log('Creating new salon with data:', JSON.stringify(salonData));
      
      const response = await apiClient.post('/admin/salons', salonData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        }
      });
      
      if (response.data && response.data.success) {
        console.log('Salon created successfully:', response.data.salon);
        await fetchSalons();
        
        // Reset form
        setNewSalonForm({
          name: '',
          address: {
            street: '',
            city: '',
            state: '',
            postalCode: ''
          },
          phone: '',
          email: '',
          description: ''
        });
        setSalonVisible(false);
        
        Alert.alert('Success', 'Salon added successfully');
      } else {
        console.error('Failed to create salon, response:', JSON.stringify(response.data));
        Alert.alert('Error', response.data?.message || 'Failed to create salon');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error creating salon:', error);
      console.error('Error details:', error.response?.data || error.message);
      setLoading(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create salon. Check console for details.');
    }
  };
  
  // Handle salon deletion
  const handleDeleteSalon = (salonId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this salon?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const response = await apiClient.delete(`/admin/salons/${salonId}`, {
                headers: {
                  Authorization: `Bearer ${userInfo.token}`
                }
              });
              
              if (response.data && response.data.success) {
                console.log('Salon deleted successfully:', response.data);
                await fetchSalons();
                Alert.alert('Success', 'Salon deleted successfully');
              } else {
                console.error('Failed to delete salon:', response.data);
                Alert.alert('Error', response.data?.message || 'Failed to delete salon');
              }
              
              setLoading(false);
            } catch (error) {
              console.error('Error deleting salon:', error);
              setLoading(false);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete salon');
            }
          }
        }
      ]
    );
  };
  
  // Render salon item
  const renderSalonItem = ({ item }) => (
    <Card style={styles.salonCard}>
      <Card.Content>
        <View style={styles.salonCardHeader}>
          <Avatar.Icon 
            size={40} 
            icon="store" 
            backgroundColor="#0F4C75" 
          />
          <View style={styles.salonInfo}>
            <Title>{item.name}</Title>
            <Paragraph style={styles.salonAddress}>
              {item.address.street}, {item.address.city}
            </Paragraph>
            <Paragraph style={styles.salonPhone}>{item.phone}</Paragraph>
          </View>
          <Chip 
            mode="flat" 
            style={[styles.statusChip, {backgroundColor: item.isActive ? '#C8E6C9' : '#FFCDD2'}]}
          >
            {item.isActive ? 'Active' : 'Inactive'}
          </Chip>
        </View>
        <Divider style={{ marginVertical: 10 }} />
        <View style={styles.salonCardActions}>
          <Button 
            mode="outlined" 
            compact 
            icon="pencil"
            onPress={() => navigation.navigate('SalonDetails', { salonId: item._id })}
          >
            Edit
          </Button>
          <Button 
            mode="outlined" 
            compact 
            icon="account-group"
            onPress={() => navigation.navigate('SalonStaff', { salonId: item._id })}
          >
            Staff
          </Button>
          <Button 
            mode="outlined" 
            compact 
            icon="delete" 
            textColor="#D32F2F"
            onPress={() => handleDeleteSalon(item._id)}
          >
            Delete
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && users.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0F4C75" />
        <Text style={{ marginTop: 20 }}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Admin Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome, {userInfo?.name}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statsCard, { backgroundColor: '#BBE1FA' }]}>
            <Card.Content>
              <Title style={styles.statsValue}>{stats.totalAppointments}</Title>
              <Paragraph>Total Appointments</Paragraph>
            </Card.Content>
          </Card>
          
          <Card style={[styles.statsCard, { backgroundColor: '#C8E6C9' }]}>
            <Card.Content>
              <Title style={styles.statsValue}>{stats.totalUsers}</Title>
              <Paragraph>Customers</Paragraph>
            </Card.Content>
          </Card>
          
          <Card style={[styles.statsCard, { backgroundColor: '#FFECB3' }]}>
            <Card.Content>
              <Title style={styles.statsValue}>{stats.totalBarbers}</Title>
              <Paragraph>Barbers</Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Salon Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Salon Management</Text>
            <Button 
              mode="contained" 
              icon="plus" 
              onPress={() => setSalonVisible(true)}
            >
              Add Salon
            </Button>
          </View>

          <FlatList
            data={salons}
            renderItem={renderSalonItem}
            keyExtractor={item => item._id}
            contentContainerStyle={{ paddingBottom: 10 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No salons found</Text>
              </View>
            }
          />
        </View>

        {/* Staff Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Staff Management</Text>
            <Button 
              mode="contained" 
              icon="plus" 
              onPress={() => setStaffVisible(true)}
            >
              Add Staff
            </Button>
          </View>

          <Searchbar
            placeholder="Search users..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />

          <Text style={styles.subtitle}>Barbers ({barbers.length})</Text>
          <FlatList
            data={barbers.filter(b => 
              b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              b.email.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            renderItem={renderUserItem}
            keyExtractor={item => item._id}
            contentContainerStyle={{ paddingBottom: 10 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No barbers found</Text>
              </View>
            }
          />

          <Text style={styles.subtitle}>Managers ({managers.length})</Text>
          <FlatList
            data={managers.filter(m => 
              m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              m.email.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            renderItem={renderUserItem}
            keyExtractor={item => item._id}
            contentContainerStyle={{ paddingBottom: 10 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No managers found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>

      {/* Add Staff Modal */}
      <Portal>
        <Modal
          visible={staffVisible}
          onDismiss={() => setStaffVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Title style={styles.modalTitle}>Add New Staff Member</Title>
          
          <TextInput
            label="Full Name"
            value={newUserForm.name}
            onChangeText={text => {
              setNewUserForm({...newUserForm, name: text});
              
              // Auto-generate staff ID when name changes and role is selected
              if (text && ['barber', 'manager'].includes(newUserForm.role)) {
                const nameInitials = text
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase();
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                const rolePrefix = newUserForm.role === 'manager' ? 'MGR' : 'BRB';
                const staffId = `${rolePrefix}-${nameInitials}${randomNum}`;
                console.log('Auto-generated Staff ID:', staffId);
              }
            }}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Email"
            value={newUserForm.email}
            onChangeText={text => setNewUserForm({...newUserForm, email: text})}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            label="Password"
            value={newUserForm.password}
            onChangeText={text => setNewUserForm({...newUserForm, password: text})}
            style={styles.input}
            mode="outlined"
            secureTextEntry
          />
          
          <TextInput
            label="Phone"
            value={newUserForm.phone}
            onChangeText={text => setNewUserForm({...newUserForm, phone: text})}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
          />
          
          <View style={styles.roleSelector}>
            <Text style={styles.roleLabel}>Role:</Text>
            <View style={styles.roleButtons}>
              <Button
                mode={newUserForm.role === 'barber' ? 'contained' : 'outlined'}
                onPress={() => {
                  // Update role and regenerate ID if name exists
                  const role = 'barber';
                  setNewUserForm({...newUserForm, role});
                  
                  if (newUserForm.name) {
                    const nameInitials = newUserForm.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase();
                    const randomNum = Math.floor(1000 + Math.random() * 9000);
                    console.log('Auto-generated Barber ID:', `BRB-${nameInitials}${randomNum}`);
                  }
                }}
                style={styles.roleButton}
              >
                Barber
              </Button>
              
              <Button
                mode={newUserForm.role === 'manager' ? 'contained' : 'outlined'}
                onPress={() => {
                  // Update role and regenerate ID if name exists
                  const role = 'manager';
                  setNewUserForm({...newUserForm, role});
                  
                  if (newUserForm.name) {
                    const nameInitials = newUserForm.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase();
                    const randomNum = Math.floor(1000 + Math.random() * 9000);
                    console.log('Auto-generated Manager ID:', `MGR-${nameInitials}${randomNum}`);
                  }
                }}
                style={styles.roleButton}
              >
                Manager
              </Button>
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <Button onPress={() => setStaffVisible(false)} style={styles.button}>
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleCreateUser} 
              loading={loading}
              style={styles.button}
            >
              Add Staff
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Add Salon Modal */}
      <Portal>
        <Modal
          visible={salonVisible}
          onDismiss={() => setSalonVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Title style={styles.modalTitle}>Add New Salon</Title>
          
          <TextInput
            label="Salon Name"
            value={newSalonForm.name}
            onChangeText={text => setNewSalonForm({...newSalonForm, name: text})}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Street Address"
            value={newSalonForm.address.street}
            onChangeText={text => setNewSalonForm({
              ...newSalonForm, 
              address: {...newSalonForm.address, street: text}
            })}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="City"
            value={newSalonForm.address.city}
            onChangeText={text => setNewSalonForm({
              ...newSalonForm, 
              address: {...newSalonForm.address, city: text}
            })}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="State/Region"
            value={newSalonForm.address.state}
            onChangeText={text => setNewSalonForm({
              ...newSalonForm, 
              address: {...newSalonForm.address, state: text}
            })}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Postal Code"
            value={newSalonForm.address.postalCode}
            onChangeText={text => setNewSalonForm({
              ...newSalonForm, 
              address: {...newSalonForm.address, postalCode: text}
            })}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
          />
          
          <TextInput
            label="Phone"
            value={newSalonForm.phone}
            onChangeText={text => setNewSalonForm({...newSalonForm, phone: text})}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
          />
          
          <TextInput
            label="Email"
            value={newSalonForm.email}
            onChangeText={text => setNewSalonForm({...newSalonForm, email: text})}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            label="Description"
            value={newSalonForm.description}
            onChangeText={text => setNewSalonForm({...newSalonForm, description: text})}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />
          
          <View style={styles.modalActions}>
            <Button onPress={() => setSalonVisible(false)} style={styles.button}>
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleCreateSalon} 
              loading={loading}
              style={styles.button}
            >
              Add Salon
            </Button>
          </View>
        </Modal>
      </Portal>

      <FAB
        style={styles.fab}
        icon="refresh"
        onPress={() => {
          fetchUsers();
          fetchSalons();
          fetchStats();
        }}
        label="Refresh"
      />

      {/* Edit User Modal */}
      <Portal>
        <Modal
          visible={selectedUserId !== null}
          onDismiss={() => setSelectedUserId(null)}
          contentContainerStyle={styles.modalContent}
        >
          <Title style={styles.modalTitle}>Edit Staff Member</Title>
          
          <TextInput
            label="Full Name"
            value={editUserForm.name}
            onChangeText={text => setEditUserForm({...editUserForm, name: text})}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Email"
            value={editUserForm.email}
            onChangeText={text => setEditUserForm({...editUserForm, email: text})}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            label="Phone"
            value={editUserForm.phone}
            onChangeText={text => setEditUserForm({...editUserForm, phone: text})}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
          />
          
          <View style={styles.roleSelector}>
            <Text style={styles.roleLabel}>Role:</Text>
            <View style={styles.roleButtons}>
              <Button
                mode={editUserForm.role === 'barber' ? 'contained' : 'outlined'}
                onPress={() => setEditUserForm({...editUserForm, role: 'barber'})}
                style={styles.roleButton}
              >
                Barber
              </Button>
              
              <Button
                mode={editUserForm.role === 'manager' ? 'contained' : 'outlined'}
                onPress={() => setEditUserForm({...editUserForm, role: 'manager'})}
                style={styles.roleButton}
              >
                Manager
              </Button>
            </View>
          </View>
          
          <View style={styles.statusSelector}>
            <Text style={styles.roleLabel}>Status:</Text>
            <View style={styles.roleButtons}>
              <Button
                mode={editUserForm.isActive ? 'contained' : 'outlined'}
                onPress={() => setEditUserForm({...editUserForm, isActive: true})}
                style={[styles.roleButton, {backgroundColor: editUserForm.isActive ? '#4CAF50' : 'transparent'}]}
                labelStyle={{color: editUserForm.isActive ? 'white' : '#4CAF50'}}
              >
                Active
              </Button>
              
              <Button
                mode={!editUserForm.isActive ? 'contained' : 'outlined'}
                onPress={() => setEditUserForm({...editUserForm, isActive: false})}
                style={[styles.roleButton, {backgroundColor: !editUserForm.isActive ? '#F44336' : 'transparent'}]}
                labelStyle={{color: !editUserForm.isActive ? 'white' : '#F44336'}}
              >
                Inactive
              </Button>
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <Button onPress={() => setSelectedUserId(null)} style={styles.button}>
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleUpdateUser} 
              loading={loading}
              style={styles.button}
            >
              Update Staff
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0F4C75',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#BBE1FA',
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  statsCard: {
    width: '30%',
    elevation: 2,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: 15,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B262C',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#1B262C',
  },
  searchbar: {
    marginBottom: 15,
    elevation: 2,
  },
  userCard: {
    marginBottom: 10,
    elevation: 2,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
  },
  userPhone: {
    fontSize: 12,
    color: '#666',
  },
  staffIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffId: {
    fontSize: 12,
    color: '#666',
  },
  roleChip: {
    marginLeft: 10,
  },
  userCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F4C75',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 5,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  roleSelector: {
    marginVertical: 15,
  },
  roleLabel: {
    marginBottom: 10,
    fontSize: 16,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  roleButton: {
    width: '45%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    marginHorizontal: 5,
    width: '45%',
  },
  statusChip: {
    marginLeft: 10,
  },
  salonCard: {
    marginBottom: 10,
    elevation: 2,
  },
  salonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salonInfo: {
    flex: 1,
    marginLeft: 10,
  },
  salonAddress: {
    fontSize: 12,
    color: '#666',
  },
  salonPhone: {
    fontSize: 12,
    color: '#666',
  },
  salonCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statusSelector: {
    marginVertical: 15,
  },
});

export default DashboardScreen; 