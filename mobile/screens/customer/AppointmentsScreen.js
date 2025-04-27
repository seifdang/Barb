import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, TextInput } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator, Chip, FAB, Divider, Banner, Dialog, Portal } from 'react-native-paper';
import { format } from 'date-fns';
import { appointmentsApi } from '../../api/client';

// Sample appointments for fallback if API fails
const sampleAppointments = [
  {
    _id: '1',
    service: {
      _id: '101',
      name: 'Classic Haircut',
      price: 25,
      duration: 30
    },
    barber: {
      _id: '201',
      name: 'John Barber'
    },
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    startTime: '10:00',
    endTime: '10:30',
    status: 'confirmed'
  },
  {
    _id: '2',
    service: {
      _id: '102',
      name: 'Beard Trim',
      price: 15,
      duration: 20
    },
    barber: {
      _id: '202',
      name: 'Mike Scissors'
    },
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    startTime: '14:00',
    endTime: '14:20',
    status: 'pending'
  },
  {
    _id: '3',
    service: {
      _id: '103',
      name: 'Premium Package',
      price: 45,
      duration: 60
    },
    barber: {
      _id: '203',
      name: 'Sarah Style'
    },
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    startTime: '11:00',
    endTime: '12:00',
    status: 'completed'
  },
  {
    _id: '4',
    service: {
      _id: '104',
      name: 'Hair Coloring',
      price: 60,
      duration: 90
    },
    barber: {
      _id: '204',
      name: 'Alex Color'
    },
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    startTime: '09:00',
    endTime: '10:30',
    status: 'cancelled'
  }
];

const AppointmentsScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  
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
      setUsingSampleData(false);
      
      console.log('Fetching appointments...');
      const response = await appointmentsApi.getUserAppointments();
      
      if (response.data.appointments && response.data.appointments.length > 0) {
        console.log(`Received ${response.data.appointments.length} appointments from API`);
        // Log the status of each appointment to debug
        response.data.appointments.forEach(app => {
          console.log(`Appointment ${app._id}: status=${app.status}, date=${new Date(app.date).toDateString()}`);
        });
        setAppointments(response.data.appointments);
      } else {
        console.log('No appointments found or empty response, using sample data');
        setAppointments(sampleAppointments);
        setUsingSampleData(true);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments from server. Showing sample data instead.');
      // Use sample data if API fails
      setAppointments(sampleAppointments);
      setUsingSampleData(true);
      setLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };
  
  const promptCancellation = (appointmentId) => {
    // Find the appointment to get more details for a better user experience
    const appointment = appointments.find(app => app._id === appointmentId);
    setAppointmentToCancel(appointmentId);
    setDialogVisible(true);
    setCancellationReason('');
    
    // Debug info
    console.log(`Prompted cancellation for appointment ${appointmentId}`);
    if (appointment) {
      console.log(`Appointment details: ${appointment.service.name} on ${format(new Date(appointment.date), 'MMM d')}`);
    }
  };
  
  const cancelAppointment = async (appointmentId, reason) => {
    try {
      setLoading(true);
      console.log(`Cancelling appointment ${appointmentId} with reason: ${reason || 'No reason provided'}`);
      
      // If using sample data, just update the local state
      if (usingSampleData) {
        console.log('Using sample data, updating locally');
        const updatedAppointments = appointments.map(appointment => 
          appointment._id === appointmentId 
            ? { ...appointment, status: 'cancelled', cancellationReason: reason }
            : appointment
        );
        setAppointments(updatedAppointments);
        setLoading(false);
        Alert.alert('Success', 'Appointment cancelled successfully');
        return;
      }
      
      // Otherwise, call the API
      console.log('Sending cancellation request with reason:', reason);
      const response = await appointmentsApi.cancelAppointment(appointmentId, { cancellationReason: reason });
      console.log('Cancel appointment response:', response.data);
      
      if (response.data && response.data.success) {
        Alert.alert('Success', 'Appointment cancelled successfully');
        // Reload appointments to get updated status
        await fetchAppointments();
      } else {
        console.error('Failed to cancel appointment:', response.data);
        Alert.alert('Error', response.data?.message || 'Failed to cancel appointment');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel appointment. Please try again.');
      setLoading(false);
    }
  };
  
  // Add a new deleteAppointment function
  const deleteAppointment = async (appointmentId) => {
    try {
      setLoading(true);
      console.log(`Deleting appointment ${appointmentId}`);
      
      // If using sample data, just update the local state
      if (usingSampleData) {
        console.log('Using sample data, updating locally');
        const updatedAppointments = appointments.filter(appointment => 
          appointment._id !== appointmentId
        );
        setAppointments(updatedAppointments);
        setLoading(false);
        Alert.alert('Success', 'Appointment deleted successfully');
        return;
      }
      
      // Otherwise, call the API
      console.log('Sending delete request');
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
  
  // Add a function to prompt for deletion confirmation
  const promptDelete = (appointmentId) => {
    // Find the appointment to get more details for a better user experience
    const appointment = appointments.find(app => app._id === appointmentId);
    
    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete this appointment${appointment ? ` for ${appointment.service.name}` : ''}?`,
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
  
  // Filter appointments by upcoming or past
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (activeTab === 'upcoming') {
      return appointmentDate >= today || 
             (appointmentDate.getDate() === today.getDate() && 
              appointment.status !== 'completed' && 
              appointment.status !== 'cancelled');
    } else {
      return appointmentDate < today || 
             appointment.status === 'completed' || 
             appointment.status === 'cancelled';
    }
  }).sort((a, b) => {
    // Sort by date
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (activeTab === 'upcoming') {
      return dateA - dateB; // Ascending for upcoming
    } else {
      return dateB - dateA; // Descending for past
    }
  });
  
  const renderAppointmentItem = ({ item }) => {
    // Improved date comparison
    const appointmentDate = new Date(item.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    
    const isPast = appointmentDate < today || 
                  item.status === 'completed' || 
                  item.status === 'cancelled';
    
    const canCancel = !isPast && 
                     (item.status === 'confirmed' || item.status === 'pending');
    
    console.log(`Appointment ${item._id}: date=${appointmentDate.toDateString()}, status=${item.status}, isPast=${isPast}, canCancel=${canCancel}`);
    
    return (
      <Card style={[styles.card, isPast && styles.pastCard]}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Title>{item.service.name}</Title>
            {canCancel && (
              <Chip 
                mode="outlined" 
                style={styles.actionChip}
                textStyle={{color: '#F44336'}}
              >
                Cancellable
              </Chip>
            )}
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
            <Text style={styles.label}>Barber:</Text>
            <Text style={styles.barberName}>{item.barber.name}</Text>
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
                  item.status === 'completed' ? '#3282B8' : '#F44336'
              }}
              textStyle={{ color: 'white' }}
            >
              {item.status.toUpperCase()}
            </Chip>
          </View>
          
          <View style={styles.buttonContainer}>
            {canCancel && (
              <Button
                mode="contained"
                style={styles.cancelButton}
                icon="close"
                color="#F44336"
                onPress={() => promptCancellation(item._id)}
              >
                Cancel
              </Button>
            )}
            
            {/* Add delete button */}
            <Button
              mode="outlined"
              style={styles.deleteButton}
              icon="delete"
              color="#FF5722"
              onPress={() => promptDelete(item._id)}
            >
              Delete
            </Button>
          </View>
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
        <Text style={styles.headerTitle}>My Appointments</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <Button
          mode={activeTab === 'upcoming' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('upcoming')}
          style={styles.tabButton}
        >
          Upcoming
        </Button>
        <Button
          mode={activeTab === 'past' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('past')}
          style={styles.tabButton}
        >
          Past
        </Button>
      </View>
      
      <Divider />
      
      {usingSampleData && (
        <Banner
          visible={true}
          icon="information"
          actions={[
            {
              label: 'Retry',
              onPress: fetchAppointments,
            },
          ]}
        >
          Showing demo appointments. Tap "Retry" to attempt loading from server.
        </Banner>
      )}
      
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
        <>
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
                  {activeTab === 'upcoming'
                    ? "You don't have any upcoming appointments"
                    : "You don't have any past appointments"}
                </Text>
                {activeTab === 'upcoming' && (
                  <Button
                    mode="contained"
                    style={styles.bookButton}
                    onPress={() => navigation.navigate('Services')}
                  >
                    Book an Appointment
                  </Button>
                )}
              </View>
            }
          />
          
          {activeTab === 'upcoming' && (
            <FAB
              style={styles.fab}
              icon="plus"
              label="Book"
              onPress={() => navigation.navigate('Services')}
            />
          )}
        </>
      )}
      
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title style={styles.dialogTitle}>Confirm Cancellation</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </Text>
            <Text style={styles.dialogSubText}>
              Please provide a reason for cancelling (optional):
            </Text>
            <TextInput
              style={styles.input}
              value={cancellationReason}
              onChangeText={setCancellationReason}
              placeholder="e.g., Schedule conflict, illness, etc."
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} style={styles.dialogButton}>Go Back</Button>
            <Button 
              onPress={() => {
                setDialogVisible(false);
                cancelAppointment(appointmentToCancel, cancellationReason);
              }}
              mode="contained"
              color="#F44336"
              style={styles.dialogConfirmButton}
            >
              Confirm Cancellation
            </Button>
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
  errorText: {
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
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
    flex: 1,
    margin: 5,
  },
  appointmentsList: {
    padding: 15,
    paddingBottom: 80, // Add extra padding at bottom for FAB
  },
  card: {
    marginBottom: 15,
    borderRadius: 10,
    elevation: 3,
  },
  pastCard: {
    opacity: 0.8,
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
  statusContainer: {
    marginTop: 10,
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  cancelButton: {
    marginTop: 15,
    borderColor: '#F44336',
    backgroundColor: '#F44336',
    padding: 5,
    marginHorizontal: 20,
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
  bookButton: {
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F4C75',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dialogText: {
    marginBottom: 10,
  },
  dialogSubText: {
    marginBottom: 10,
  },
  dialogButton: {
    marginRight: 10,
  },
  dialogConfirmButton: {
    marginLeft: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    minHeight: 80,
  },
  barberName: {
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionChip: {
    borderColor: '#F44336',
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  deleteButton: {
    borderColor: '#FF5722',
    backgroundColor: 'white',
  },
});

export default AppointmentsScreen; 