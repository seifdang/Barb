import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import { Text, Card, Button, Title, ActivityIndicator, Divider, Avatar, Chip, Portal, Modal, RadioButton } from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';

const SalonStaffScreen = ({ route, navigation }) => {
  const { salonId } = route.params;
  const { userInfo } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salon, setSalon] = useState(null);
  const [staff, setStaff] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchSalonWithStaff();
  }, [salonId]);

  const fetchSalonWithStaff = async () => {
    try {
      setLoading(true);
      
      // Get salon details with staff
      const response = await apiClient.get(`/admin/salons/${salonId}`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });
      
      if (response.data && response.data.success) {
        const salonData = response.data.salon;
        setSalon(salonData);
        
        // Fetch staff details
        if (salonData.staff && salonData.staff.length > 0) {
          const staffIds = Array.isArray(salonData.staff) 
            ? salonData.staff.map(s => typeof s === 'object' ? s._id : s) 
            : [];
            
          const staffResponse = await apiClient.get('/admin/users', {
            headers: {
              Authorization: `Bearer ${userInfo.token}`
            }
          });
          
          if (staffResponse.data && staffResponse.data.success) {
            // Filter users that are in the salon's staff
            const staffMembers = staffResponse.data.users.filter(user => 
              staffIds.includes(user._id)
            );
            setStaff(staffMembers);
            
            // Filter available barbers and managers not in this salon
            const availableStaff = staffResponse.data.users.filter(user => 
              (user.role === 'barber' || user.role === 'manager') && 
              !staffIds.includes(user._id)
            );
            setAvailableUsers(availableStaff);
          }
        } else {
          // If no staff, get available barbers and managers
          const usersResponse = await apiClient.get('/admin/users', {
            headers: {
              Authorization: `Bearer ${userInfo.token}`
            }
          });
          
          if (usersResponse.data && usersResponse.data.success) {
            const availableStaff = usersResponse.data.users.filter(user => 
              user.role === 'barber' || user.role === 'manager'
            );
            setAvailableUsers(availableStaff);
          }
        }
        
        console.log('Salon staff loaded');
      } else {
        console.error('Failed to load salon details:', response.data);
        Alert.alert('Error', 'Failed to load salon details');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching salon staff:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load salon staff: ' + (error.message || 'Unknown error'));
    }
  };

  const addStaffToSalon = async () => {
    if (!selectedUser) {
      Alert.alert('Error', 'Please select a user to add');
      return;
    }
    
    try {
      setSaving(true);
      
      // First, ensure the user has the role of 'barber' (lowercase)
      const userUpdateResponse = await apiClient.put(`/admin/users/${selectedUser._id}`, 
        { role: 'barber' },
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        }
      );
      
      if (!userUpdateResponse.data || !userUpdateResponse.data.success) {
        throw new Error('Failed to update user role');
      }
      
      // Then add to salon
      const response = await apiClient.post(`/admin/salons/${salonId}/staff`, 
        { staffId: selectedUser._id },
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        }
      );
      
      if (response.data && response.data.success) {
        Alert.alert('Success', `${selectedUser.name} has been added to the salon staff`);
        setModalVisible(false);
        setSelectedUser(null);
        fetchSalonWithStaff(); // Refresh data
      } else {
        throw new Error('Failed to add staff to salon');
      }
      
      setSaving(false);
    } catch (error) {
      console.error('Error adding staff:', error);
      Alert.alert('Error', error.message || 'Failed to add staff to salon');
      setSaving(false);
    }
  };

  const handleRemoveStaff = (staffId) => {
    Alert.alert(
      'Confirm Removal',
      'Are you sure you want to remove this staff member from the salon?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const response = await apiClient.delete(`/admin/salons/${salonId}/staff/${staffId}`, {
                headers: {
                  Authorization: `Bearer ${userInfo.token}`
                }
              });
              
              if (response.data && response.data.success) {
                Alert.alert('Success', 'Staff member removed successfully');
                fetchSalonWithStaff();
              } else {
                console.error('Failed to remove staff:', response.data);
                Alert.alert('Error', response.data?.message || 'Failed to remove staff member');
              }
              
              setLoading(false);
            } catch (error) {
              console.error('Error removing staff:', error);
              setLoading(false);
              Alert.alert('Error', error.response?.data?.message || 'Failed to remove staff member');
            }
          }
        }
      ]
    );
  };

  const renderStaffItem = ({ item }) => (
    <Card style={styles.staffCard}>
      <Card.Content>
        <View style={styles.staffCardHeader}>
          <Avatar.Text 
            size={40} 
            label={item.name.split(' ').map(n => n[0]).join('')} 
            backgroundColor="#0F4C75" 
          />
          <View style={styles.staffInfo}>
            <Title>{item.name}</Title>
            <View style={styles.staffDetailsRow}>
              <Text style={styles.staffEmail}>{item.email}</Text>
              {item.phone && <Text style={styles.staffPhone}>• {item.phone}</Text>}
            </View>
            {item.staffId && (
              <Text style={styles.staffId}>ID: {item.staffId}</Text>
            )}
          </View>
          <Chip 
            mode="outlined" 
            style={[styles.roleChip, {
              backgroundColor: item.role === 'manager' ? '#FFD700' : '#BBE1FA'
            }]}
          >
            {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
          </Chip>
        </View>
        <Divider style={{ marginVertical: 10 }} />
        <Button 
          mode="outlined" 
          icon="account-remove" 
          textColor="#D32F2F"
          onPress={() => handleRemoveStaff(item._id)}
        >
          Remove from Salon
        </Button>
      </Card.Content>
    </Card>
  );

  const renderAvailableUserItem = ({ item }) => (
    <View style={styles.radioItem}>
      <RadioButton
        value={item._id}
        status={selectedUser && selectedUser._id === item._id ? 'checked' : 'unchecked'}
        onPress={() => setSelectedUser(item)}
      />
      <View style={styles.radioItemContent}>
        <Text style={styles.radioItemName}>{item.name}</Text>
        <Text style={styles.radioItemRole}>{item.role || 'No role'}</Text>
        {item.staffId && <Text style={styles.radioItemId}>ID: {item.staffId}</Text>}
      </View>
    </View>
  );

  if (loading && !salon) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F4C75" />
        <Text style={{ marginTop: 20 }}>Loading salon staff...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Salon Staff</Text>
        {salon && <Text style={styles.headerSubtitle}>{salon.name}</Text>}
      </View>
      
      <View style={styles.content}>
        <View style={styles.actionBar}>
          <Button 
            mode="contained" 
            icon="account-plus" 
            onPress={() => setModalVisible(true)}
          >
            Add Staff Member
          </Button>
        </View>
        
        <Title style={styles.title}>Current Staff ({staff.length})</Title>
        
        {staff.length > 0 ? (
          <FlatList
            data={staff}
            renderItem={renderStaffItem}
            keyExtractor={item => item._id}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No staff members assigned to this salon</Text>
            </Card.Content>
          </Card>
        )}
      </View>
      
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            setSelectedUser(null);
          }}
          contentContainerStyle={styles.modalContent}
        >
          <Title style={styles.modalTitle}>Add Staff to Salon</Title>
          
          <ScrollView style={styles.userList}>
            {availableUsers.length > 0 ? (
              <FlatList
                data={availableUsers}
                renderItem={renderAvailableUserItem}
                keyExtractor={item => item._id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyUserList}>
                <Text style={styles.emptyText}>No available users to add as staff</Text>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.modalActions}>
            <Button 
              onPress={() => {
                setModalVisible(false);
                setSelectedUser(null);
              }}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={addStaffToSalon}
              loading={saving}
              disabled={!selectedUser || saving}
              style={styles.button}
            >
              Add to Salon
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    padding: 15,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
  },
  title: {
    marginBottom: 15,
  },
  staffCard: {
    marginBottom: 10,
    elevation: 2,
  },
  staffCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffInfo: {
    flex: 1,
    marginLeft: 10,
  },
  staffDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffEmail: {
    fontSize: 12,
    color: '#666',
  },
  staffPhone: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  staffId: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  roleChip: {
    marginLeft: 10,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 5,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  userList: {
    maxHeight: 300,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  radioItemContent: {
    marginLeft: 10,
  },
  radioItemName: {
    fontWeight: 'bold',
  },
  radioItemRole: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  radioItemId: {
    fontSize: 12,
    color: '#666',
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
  noUsersText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
  },
  emptyUserList: {
    padding: 20,
    alignItems: 'center',
  }
});

export default SalonStaffScreen; 