import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, Card, Title, Paragraph, Button, FAB, Avatar, ActivityIndicator, Chip, Modal, Portal, TextInput, Divider } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { appointmentsApi } from '../../api/client';
import { AuthContext } from '../../context/AuthContext';

const BarberDashboardScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [markedDates, setMarkedDates] = useState({});
  const [dailySchedule, setDailySchedule] = useState([]);
  
  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAction, setModalAction] = useState('');
  const [modalNote, setModalNote] = useState('');
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [newTimeSlot, setNewTimeSlot] = useState(null);

  useEffect(() => {
    fetchAppointments();
    
    // Refresh when screen is focused
    const unsubscribe = navigation.addListener('focus', fetchAppointments);
    return unsubscribe;
  }, [navigation]);
  
  useEffect(() => {
    if (appointments.length > 0) {
      generateMarkedDates();
      filterDailySchedule();
    }
  }, [appointments, selectedDate]);
  
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      const response = await appointmentsApi.getUserAppointments();
      
      if (response.data && response.data.appointments) {
        setAppointments(response.data.appointments);
      } else {
        setAppointments([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    }
  };
  
  const generateMarkedDates = () => {
    const dates = {};
    
    // Group appointments by date
    appointments.forEach(appointment => {
      const dateStr = appointment.date.split('T')[0];
      
      if (!dates[dateStr]) {
        dates[dateStr] = {
          marked: true,
          dotColor: getStatusColor(appointment.status),
          dots: [{ color: getStatusColor(appointment.status) }]
        };
      } else {
        // Add another dot if the date already exists
        dates[dateStr].dots.push({ color: getStatusColor(appointment.status) });
      }
    });
    
    // Highlight selected date
    if (dates[selectedDate]) {
      dates[selectedDate] = {
        ...dates[selectedDate],
        selected: true,
        selectedColor: 'rgba(15, 76, 117, 0.2)'  // Semi-transparent primary color
      };
    } else {
      dates[selectedDate] = {
        selected: true,
        selectedColor: 'rgba(15, 76, 117, 0.2)'
      };
    }
    
    setMarkedDates(dates);
  };
  
  const filterDailySchedule = () => {
    // Filter appointments for the selected date
    const dailyAppointments = appointments.filter(
      appointment => appointment.date.split('T')[0] === selectedDate
    );
    
    // Sort by start time
    dailyAppointments.sort((a, b) => {
      const [aHour, aMinute] = a.startTime.split(':').map(Number);
      const [bHour, bMinute] = b.startTime.split(':').map(Number);
      return (aHour * 60 + aMinute) - (bHour * 60 + bMinute);
    });
    
    // Create full day schedule with 30-minute slots (9am-6pm)
    const schedule = [];
    
    for (let hour = 9; hour < 18; hour++) {
      for (let minute of [0, 30]) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = minute === 30 ? hour + 1 : hour;
        const endMinute = minute === 30 ? 0 : 30;
        const endTimeString = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        // Find appointment for this time slot
        const appointment = dailyAppointments.find(
          appt => appt.startTime === timeString
        );
        
        schedule.push({
          time: timeString,
          endTime: endTimeString,
          appointment: appointment || null,
          status: appointment ? appointment.status : 'free'
        });
      }
    }
    
    setDailySchedule(schedule);
    
    // Also update available slots for potential appointment changes
    setAvailableSlots(
      schedule.filter(slot => slot.status === 'free').map(slot => ({
        startTime: slot.time,
        endTime: slot.endTime
      }))
    );
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';  // Green
      case 'pending': return '#FFC107';    // Yellow
      case 'completed': return '#3282B8';  // Blue
      case 'cancelled': return '#F44336';  // Red
      case 'no-show': return '#9C27B0';    // Purple
      default: return '#757575';           // Grey
    }
  };
  
  const handleDateSelect = (date) => {
    setSelectedDate(date.dateString);
  };
  
  const openAppointmentActions = (appointment) => {
    setSelectedAppointment(appointment);
    setModalVisible(true);
    setModalAction('');
    setModalNote('');
  };
  
  const handleActionSelect = (action) => {
    setModalAction(action);
  };
  
  const handleAppointmentAction = async () => {
    if (!selectedAppointment || !modalAction) return;
    
    try {
      setLoading(true);
      setModalVisible(false);
      
      let response;
      
      switch (modalAction) {
        case 'complete':
          response = await appointmentsApi.updateAppointment(
            selectedAppointment._id,
            {
              status: 'completed',
              notes: modalNote
            }
          );
          
          if (response.data && response.data.success) {
            Alert.alert('Success', 'Appointment marked as completed');
          }
          break;
          
        case 'cancel':
          response = await appointmentsApi.cancelAppointment(
            selectedAppointment._id,
            { cancellationReason: modalNote }
          );
          
          if (response.data && response.data.success) {
            Alert.alert('Success', 'Appointment cancelled successfully');
          }
          break;
          
        case 'noshow':
          response = await appointmentsApi.updateAppointment(
            selectedAppointment._id,
            {
              status: 'no-show',
              notes: modalNote
            }
          );
          
          if (response.data && response.data.success) {
            Alert.alert('Success', 'Appointment marked as no-show');
          }
          break;
          
        case 'swap':
          setSwapModalVisible(true);
          setModalVisible(false);
          return;
      }
      
      await fetchAppointments();
      setLoading(false);
      
    } catch (error) {
      console.error('Error updating appointment:', error);
      setLoading(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update appointment');
    }
  };
  
  const handleTimeSwap = async () => {
    if (!selectedAppointment || !newTimeSlot) return;
    
    try {
      setLoading(true);
      setSwapModalVisible(false);
      
      const response = await appointmentsApi.updateAppointment(
        selectedAppointment._id,
        {
          startTime: newTimeSlot.startTime,
          endTime: newTimeSlot.endTime,
          notes: `Time changed from ${selectedAppointment.startTime}-${selectedAppointment.endTime} to ${newTimeSlot.startTime}-${newTimeSlot.endTime}`
        }
      );
      
      if (response.data && response.data.success) {
        Alert.alert('Success', 'Appointment time updated successfully');
        await fetchAppointments();
      } else {
        Alert.alert('Error', 'Failed to update appointment time');
      }
      
      setNewTimeSlot(null);
      setLoading(false);
      
    } catch (error) {
      console.error('Error updating appointment time:', error);
      setLoading(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update appointment time');
    }
  };
  
  const renderTimeSlot = (slot, index) => {
    const isCurrent = () => {
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      
      if (selectedDate !== today) return false;
      
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const [slotHour, slotMinute] = slot.time.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      
      return (
        (currentHour > slotHour || (currentHour === slotHour && currentMinute >= slotMinute)) &&
        (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute))
      );
    };
    
    return (
      <View key={index} style={[
        styles.timeSlot,
        isCurrent() && styles.currentTimeSlot
      ]}>
        <View style={styles.timeColumn}>
          <Text style={styles.timeText}>{slot.time}</Text>
        </View>
        
        <View style={[
          styles.appointmentColumn,
          { backgroundColor: slot.appointment ? getStatusColor(slot.appointment.status) + '30' : 'transparent' }
        ]}>
          {slot.appointment ? (
            <TouchableOpacity 
              style={styles.appointmentCard} 
              onPress={() => openAppointmentActions(slot.appointment)}
            >
              <View style={styles.appointmentHeader}>
                <Text style={styles.customerName}>{slot.appointment.customer.name}</Text>
                <Chip 
                  style={[styles.statusChip, { backgroundColor: getStatusColor(slot.appointment.status) }]}
                  textStyle={styles.statusChipText}
                >
                  {slot.appointment.status.toUpperCase()}
                </Chip>
              </View>
              <Text style={styles.serviceText}>{slot.appointment.service.name}</Text>
              <Text style={styles.priceText}>${slot.appointment.service.price}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptySlot}>
              <Text style={styles.emptySlotText}>Free</Text>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  if (loading && appointments.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F4C75" />
        <Text style={{ marginTop: 20 }}>Loading your schedule...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Barber Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome, {userInfo?.name}</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            markingType={'multi-dot'}
            markedDates={markedDates}
            onDayPress={handleDateSelect}
            theme={{
              todayTextColor: '#0F4C75',
              arrowColor: '#0F4C75',
            }}
          />
        </View>
        
        {/* Daily Schedule */}
        <View style={styles.scheduleContainer}>
          <Text style={styles.scheduleTitle}>
            Schedule for {format(new Date(selectedDate), 'MMMM d, yyyy')}
          </Text>
          
          {dailySchedule.length > 0 ? (
            <View style={styles.scheduleGrid}>
              {dailySchedule.map((slot, index) => renderTimeSlot(slot, index))}
            </View>
          ) : (
            <View style={styles.emptySchedule}>
              <Text style={styles.emptyText}>No appointments scheduled for this day.</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      <FAB
        style={styles.fab}
        icon="refresh"
        onPress={fetchAppointments}
      />
      
      {/* Appointment Actions Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Title style={styles.modalTitle}>Appointment Actions</Title>
          
          {selectedAppointment && (
            <View style={styles.appointmentDetails}>
              <Text style={styles.appointmentDetail}>
                <Text style={styles.detailLabel}>Customer: </Text>
                {selectedAppointment.customer.name}
              </Text>
              <Text style={styles.appointmentDetail}>
                <Text style={styles.detailLabel}>Service: </Text>
                {selectedAppointment.service.name}
              </Text>
              <Text style={styles.appointmentDetail}>
                <Text style={styles.detailLabel}>Time: </Text>
                {selectedAppointment.startTime} - {selectedAppointment.endTime}
              </Text>
              <Text style={styles.appointmentDetail}>
                <Text style={styles.detailLabel}>Status: </Text>
                {selectedAppointment.status.toUpperCase()}
              </Text>
            </View>
          )}
          
          <Divider style={styles.divider} />
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                modalAction === 'complete' && styles.actionButtonSelected
              ]}
              onPress={() => handleActionSelect('complete')}
            >
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                modalAction === 'cancel' && styles.actionButtonSelected
              ]}
              onPress={() => handleActionSelect('cancel')}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                modalAction === 'noshow' && styles.actionButtonSelected
              ]}
              onPress={() => handleActionSelect('noshow')}
            >
              <Text style={styles.actionButtonText}>No-Show</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                modalAction === 'swap' && styles.actionButtonSelected
              ]}
              onPress={() => handleActionSelect('swap')}
            >
              <Text style={styles.actionButtonText}>Change Time</Text>
            </TouchableOpacity>
          </View>
          
          {modalAction && modalAction !== 'swap' && (
            <TextInput
              label={
                modalAction === 'complete' ? 'Notes (optional)' :
                modalAction === 'cancel' ? 'Cancellation Reason' : 'No-Show Notes'
              }
              value={modalNote}
              onChangeText={setModalNote}
              style={styles.noteInput}
              multiline
            />
          )}
          
          <View style={styles.modalActions}>
            <Button onPress={() => setModalVisible(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleAppointmentAction}
              disabled={modalAction === 'cancel' && !modalNote}
              style={styles.modalButton}
            >
              Confirm
            </Button>
          </View>
        </Modal>
      </Portal>
      
      {/* Swap Time Modal */}
      <Portal>
        <Modal
          visible={swapModalVisible}
          onDismiss={() => setSwapModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Title style={styles.modalTitle}>Select New Time</Title>
          
          {availableSlots.length > 0 ? (
            <ScrollView style={styles.timeSlotsContainer}>
              {availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlotButton,
                    newTimeSlot && newTimeSlot.startTime === slot.startTime && styles.selectedTimeSlot
                  ]}
                  onPress={() => setNewTimeSlot(slot)}
                >
                  <Text style={styles.timeSlotButtonText}>
                    {slot.startTime} - {slot.endTime}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noSlotsText}>No available time slots for this day.</Text>
          )}
          
          <View style={styles.modalActions}>
            <Button onPress={() => setSwapModalVisible(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleTimeSwap}
              disabled={!newTimeSlot}
              style={styles.modalButton}
            >
              Change Time
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
  calendarContainer: {
    margin: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  scheduleContainer: {
    margin: 10,
    marginTop: 5,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1B262C',
  },
  scheduleGrid: {
    marginTop: 5,
  },
  timeSlot: {
    flexDirection: 'row',
    marginBottom: 10,
    height: 80,
  },
  currentTimeSlot: {
    borderLeftWidth: 3,
    borderLeftColor: '#0F4C75',
  },
  timeColumn: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  appointmentColumn: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 5,
    padding: 10,
    justifyContent: 'center',
  },
  appointmentCard: {
    padding: 5,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  serviceText: {
    fontSize: 12,
  },
  priceText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statusChip: {
    height: 20,
    paddingHorizontal: 5,
  },
  statusChipText: {
    fontSize: 8,
    color: 'white',
  },
  emptySlot: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  emptySlotText: {
    color: '#757575',
    fontStyle: 'italic',
  },
  emptySchedule: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#757575',
    textAlign: 'center',
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
    borderRadius: 10,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 15,
  },
  appointmentDetails: {
    marginBottom: 15,
  },
  appointmentDetail: {
    marginBottom: 5,
  },
  detailLabel: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  actionButton: {
    width: '48%',
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0F4C75',
    borderRadius: 5,
    marginBottom: 10,
  },
  actionButtonSelected: {
    backgroundColor: '#0F4C75',
  },
  actionButtonText: {
    color: '#0F4C75',
  },
  noteInput: {
    marginTop: 10,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  timeSlotsContainer: {
    maxHeight: 300,
    marginVertical: 10,
  },
  timeSlotButton: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#BBE1FA',
    borderWidth: 1,
    borderColor: '#0F4C75',
  },
  timeSlotButtonText: {
    fontSize: 16,
  },
  noSlotsText: {
    textAlign: 'center',
    margin: 20,
    color: '#757575',
  },
});

export default BarberDashboardScreen; 