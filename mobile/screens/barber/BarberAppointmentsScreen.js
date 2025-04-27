import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, TextInput } from 'react-native';
import { Text, Card, Title, Button, ActivityIndicator, Chip, Divider, Banner, Dialog, Portal, Menu, IconButton } from 'react-native-paper';
import { format } from 'date-fns';
import { appointmentsApi } from '../../api/client';
import { AuthContext } from '../../context/AuthContext';

const BarberAppointmentsScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'past', 'today'
  
  // Dialog states
  const [dialogVisible, setDialogVisible] = useState(false);
  const [actionDialogType, setActionDialogType] = useState(''); // 'cancel', 'complete', 'noshow'
  const [actionReason, setActionReason] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [menuVisible, setMenuVisible] = useState({});

  useEffect(() => {
    fetchAppointments();
    
    // Refresh appointments when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAppointments();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await appointmentsApi.getUserAppointments();
      
      if (response.data.appointments && response.data.appointments.length > 0) {
        setAppointments(response.data.appointments);
      } else {
        setAppointments([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments. Please try again.');
      setLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };
  
  const openActionDialog = (appointment, type) => {
    setSelectedAppointment(appointment);
    setActionDialogType(type);
    setActionReason('');
    setDialogVisible(true);
    setMenuVisible({});
  };
  
  const performAppointmentAction = async () => {
    if (!selectedAppointment) return;
    
    setDialogVisible(false);
    setLoading(true);
    
    try {
      let response;
      
      switch (actionDialogType) {
        case 'cancel':
          response = await appointmentsApi.cancelAppointment(
            selectedAppointment._id,
            { cancellationReason: actionReason }
          );
          if (response.data.success) {
            Alert.alert('Success', 'Appointment cancelled successfully');
          }
          break;
          
        case 'complete':
          response = await appointmentsApi.updateAppointment(
            selectedAppointment._id, 
            { 
              status: 'completed',
              notes: actionReason
            }
          );
          if (response.data.success) {
            Alert.alert('Success', 'Appointment marked as completed');
          }
          break;
          
        case 'noshow':
          response = await appointmentsApi.updateAppointment(
            selectedAppointment._id, 
            { 
              status: 'no-show',
              notes: actionReason
            }
          );
          if (response.data.success) {
            Alert.alert('Success', 'Appointment marked as no-show');
          }
          break;
      }
      
      await fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update appointment');
    } finally {
      setLoading(false);
    }
  };
  
  // First, add a promptDelete function to handle appointment deletion
  const promptDelete = (appointmentId) => {
    // Find the appointment to get more details for a better user experience
    const appointment = appointments.find(app => app._id === appointmentId);
    
    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete this appointment${appointment ? ` for ${appointment.service.name}` : ''}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: () => deleteAppointment(appointmentId),
          style: 'destructive'
        }
      ]
    );
    
    // Debug info
    console.log(`Prompted deletion for appointment ${appointmentId}`);
  };

  // Add a function to handle appointment deletion
  const deleteAppointment = async (appointmentId) => {
    try {
      setLoading(true);
      console.log(`Deleting appointment ${appointmentId}`);
      
      // Call the API to delete the appointment
      const response = await appointmentsApi.deleteAppointment(appointmentId);
      console.log('Delete appointment response:', response.data);
      
      if (response.data && response.data.success) {
        Alert.alert('Success', 'Appointment deleted successfully');
        // Reload appointments to refresh the list
        await fetchAppointments();
      } else {
        console.error('Failed to delete appointment:', response.data);
        Alert.alert('Error', response.data?.message || 'Failed to delete appointment');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete appointment. Please try again.');
      setLoading(false);
    }
  };
  
  // Filter appointments by tab
  const filteredAppointments = appointments.filter(appointment => {
    // Improved date comparison
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    
    // Reset hours for date comparison
    const todayForComparison = new Date();
    todayForComparison.setHours(0, 0, 0, 0);
    
    const appointmentDay = appointmentDate.getDate();
    const appointmentMonth = appointmentDate.getMonth();
    const appointmentYear = appointmentDate.getFullYear();
    
    const todayDay = todayForComparison.getDate();
    const todayMonth = todayForComparison.getMonth();
    const todayYear = todayForComparison.getFullYear();
    
    // Check if the appointment is today
    const isToday = appointmentDay === todayDay && 
                    appointmentMonth === todayMonth && 
                    appointmentYear === todayYear;
    
    // Check appointment status
    const isCancelled = appointment.status === 'cancelled';
    const isCompleted = appointment.status === 'completed';
    const isNoShow = appointment.status === 'no-show';
    const isActive = !isCancelled && !isCompleted && !isNoShow;
    
    // Use appointmentDate with time reset for proper comparison
    const appointmentDateNoTime = new Date(appointmentDate);
    appointmentDateNoTime.setHours(0, 0, 0, 0);
    
    // Future date (tomorrow or later)
    const isFuture = appointmentDateNoTime > todayForComparison;
    
    // Past date (yesterday or earlier)
    const isPast = appointmentDateNoTime < todayForComparison;
    
    if (activeTab === 'today') {
      // Today tab should only show active appointments for today
      return isToday && isActive;
    } else if (activeTab === 'upcoming') {
      // Upcoming tab should show future active appointments
      // This includes tomorrow and later (not today)
      return isFuture && isActive;
    } else { // past tab
      // Past tab shows:
      // 1. Any appointment with status completed/cancelled/no-show (regardless of date)
      // 2. Any appointment with date in the past (yesterday or earlier)
      return isPast || isCancelled || isCompleted || isNoShow;
    }
  }).sort((a, b) => {
    // Sort by date and time
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    // For same day, sort by time
    if (dateA.toDateString() === dateB.toDateString()) {
      const [hoursA, minutesA] = a.startTime.split(':').map(Number);
      const [hoursB, minutesB] = b.startTime.split(':').map(Number);
      return (hoursA * 60 + minutesA) - (hoursB * 60 + minutesB);
    }
    
    if (activeTab === 'past') {
      return dateB - dateA; // Descending for past
    } else {
      return dateA - dateB; // Ascending for upcoming and today
    }
  });
  
  const renderAppointmentItem = ({ item }) => {
    const isPast = new Date(item.date) < new Date() || 
                  item.status === 'completed' || 
                  item.status === 'cancelled' ||
                  item.status === 'no-show';
    
    const toggleMenu = (id) => {
      setMenuVisible({
        ...menuVisible,
        [id]: !menuVisible[id]
      });
    };
    
    return (
      <Card style={[styles.card, isPast && styles.pastCard]}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Title>{item.service.name}</Title>
            
            {!isPast && (
              <View>
                <IconButton
                  icon="dots-vertical"
                  onPress={() => toggleMenu(item._id)}
                  size={24}
                />
                <Menu
                  visible={menuVisible[item._id] || false}
                  onDismiss={() => toggleMenu(item._id)}
                  anchor={{ x: 200, y: 0 }}
                  style={styles.menu}
                >
                  <Menu.Item
                    onPress={() => openActionDialog(item, 'complete')}
                    title="Mark as Complete"
                    icon="check"
                  />
                  <Menu.Item
                    onPress={() => openActionDialog(item, 'cancel')}
                    title="Cancel Appointment"
                    icon="close"
                  />
                  <Menu.Item
                    onPress={() => openActionDialog(item, 'noshow')}
                    title="Mark as No-Show"
                    icon="account-off"
                  />
                  <Menu.Item
                    onPress={() => promptDelete(item._id)}
                    title="Delete Appointment"
                    icon="delete"
                  />
                </Menu>
              </View>
            )}
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Customer:</Text>
            <Text>{item.customer.name}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Barber:</Text>
            <Text>{item.barber.name}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text>{format(new Date(item.date), 'MMMM d, yyyy')}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Time:</Text>
            <Text>{item.startTime} - {item.endTime}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Service:</Text>
            <Text>{item.service.name}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Price:</Text>
            <Text>${item.service.price}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <Chip
              style={{
                backgroundColor: 
                  item.status === 'confirmed' ? '#4CAF50' :
                  item.status === 'pending' ? '#FFC107' :
                  item.status === 'completed' ? '#3282B8' :
                  item.status === 'no-show' ? '#9C27B0' : '#F44336'
              }}
              textStyle={{ color: 'white' }}
            >
              {item.status.toUpperCase()}
            </Chip>
          </View>
          
          {item.cancellationReason && (
            <View style={styles.infoBox}>
              <Text style={styles.label}>Cancellation Reason:</Text>
              <Text>{item.cancellationReason}</Text>
              {item.cancelledBy && (
                <Text style={styles.subText}>Cancelled by: {item.cancelledBy}</Text>
              )}
            </View>
          )}
          
          {item.notes && (
            <View style={styles.infoBox}>
              <Text style={styles.label}>Notes:</Text>
              <Text>{item.notes}</Text>
            </View>
          )}
          
          {!isPast && (
            <Button
              mode="outlined"
              style={styles.cancelButton}
              icon="close"
              onPress={() => openActionDialog(item, 'cancel')}
            >
              Cancel Appointment
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F4C75" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments Management</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <Button
          mode={activeTab === 'today' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('today')}
          style={[styles.tabButton, { flex: 1 }]}
        >
          Today
        </Button>
        <Button
          mode={activeTab === 'upcoming' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('upcoming')}
          style={[styles.tabButton, { flex: 1 }]}
        >
          Upcoming
        </Button>
        <Button
          mode={activeTab === 'past' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('past')}
          style={[styles.tabButton, { flex: 1 }]}
        >
          Past
        </Button>
      </View>
      
      <Divider />
      
      {error ? (
        <Banner
          visible={true}
          icon="alert"
          actions={[
            {
              label: 'Retry',
              onPress: fetchAppointments,
            },
          ]}
        >
          {error}
        </Banner>
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointmentItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.appointmentsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0F4C75']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'today'
                  ? "You don't have any appointments scheduled for today"
                  : activeTab === 'upcoming'
                  ? "You don't have any upcoming appointments"
                  : "You don't have any past appointments"}
              </Text>
            </View>
          }
        />
      )}
      
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {actionDialogType === 'cancel' ? 'Cancel Appointment' : 
             actionDialogType === 'complete' ? 'Complete Appointment' : 
             'Mark as No-Show'}
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              {actionDialogType === 'cancel' ? 'Please provide a reason for cancelling:' : 
               actionDialogType === 'complete' ? 'Add any notes about this appointment (optional):' : 
               'Add any notes about this no-show (optional):'}
            </Text>
            <TextInput
              style={styles.input}
              value={actionReason}
              onChangeText={setActionReason}
              placeholder={
                actionDialogType === 'cancel' ? "e.g., Customer requested cancellation" : 
                actionDialogType === 'complete' ? "e.g., Service notes, products used" : 
                "e.g., Customer didn't show up, no call"
              }
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={performAppointmentAction}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>
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
    color: 'white',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: 'white',
  },
  tabButton: {
    margin: 5,
  },
  appointmentsList: {
    padding: 15,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 15,
    borderRadius: 10,
    elevation: 3,
  },
  pastCard: {
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  label: {
    fontWeight: 'bold',
    color: '#666',
  },
  subText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 2,
  },
  statusContainer: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
    textAlign: 'center',
  },
  dialogText: {
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    minHeight: 80,
  },
  menu: {
    position: 'absolute',
    top: 50,
    right: 10,
  },
  infoBox: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  cancelButton: {
    marginTop: 15,
    borderColor: '#F44336',
    borderWidth: 1,
  },
});

export default BarberAppointmentsScreen; 