import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, Avatar, Button, ActivityIndicator, Chip, Searchbar, ProgressBar, Modal, Portal, DataTable } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { format } from 'date-fns';

const ManagerDashboardScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [barberStats, setBarberStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('week'); // 'day', 'week', 'month'
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [appointmentHistory, setAppointmentHistory] = useState([]);

  // Check if user is manager
  useEffect(() => {
    if (userInfo && userInfo.role !== 'manager' && userInfo.role !== 'admin') {
      Alert.alert('Access Denied', 'Only managers can access this screen.');
      navigation.goBack();
    } else {
      fetchBarbers();
    }
  }, [userInfo]);

  // Fetch barbers when date filter changes
  useEffect(() => {
    if (selectedBarber) {
      fetchBarberStats(selectedBarber._id);
    }
  }, [dateFilter, selectedBarber]);

  // Manager API endpoints
  const managerApi = {
    getBarbers: () => apiClient.get('/users/barbers'),
    getBarberStats: (barberId, period) => apiClient.get(`/manager/barber/${barberId}/stats?period=${period}`),
    getBarberAppointments: (barberId, period) => apiClient.get(`/manager/barber/${barberId}/appointments?period=${period}`),
    getManagerSalons: () => apiClient.get('/manager/salons')
  };

  // Fetch barbers
  const fetchBarbers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/barbers');
      
      if (response.data && response.data.success) {
        setBarbers(response.data.barbers || []);
        
        // If there are barbers, select the first one by default
        if (response.data.barbers && response.data.barbers.length > 0) {
          setSelectedBarber(response.data.barbers[0]);
          fetchBarberStats(response.data.barbers[0]._id);
        }
      } else {
        Alert.alert('Error', 'Failed to load barbers');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching barbers:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load barbers');
    }
  };

  // Fetch barber statistics
  const fetchBarberStats = async (barberId) => {
    try {
      setLoading(true);
      
      // Make real API calls to get barber stats and appointments
      const statsResponse = await apiClient.get(`/manager/barber/${barberId}/stats?period=${dateFilter}`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });
      
      const appointmentsResponse = await apiClient.get(`/manager/barber/${barberId}/appointments?period=${dateFilter}`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });
      
      if (statsResponse.data && statsResponse.data.success && 
          appointmentsResponse.data && appointmentsResponse.data.success) {
        
        const barberStatsData = statsResponse.data.stats;
        const appointments = appointmentsResponse.data.appointments || [];
        
        // Process schedule data for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter appointments for today to build the schedule
        const todayAppointments = appointments.filter(app => {
          const appDate = new Date(app.date);
          appDate.setHours(0, 0, 0, 0);
          return appDate.getTime() === today.getTime();
        });
        
        // Create time slots (9am - 6pm)
        const hoursInDay = 9;
        const timeSlots = [];
        
        for (let i = 0; i < hoursInDay; i++) {
          const hour = 9 + i;
          
          // Morning slot (Hour:00)
          const morningSlot = {
            time: `${hour}:00 - ${hour}:30`,
            status: 'free'
          };
          
          // Afternoon slot (Hour:30)
          const afternoonSlot = {
            time: `${hour}:30 - ${hour + 1}:00`,
            status: 'free'
          };
          
          // Check if slots are booked
          todayAppointments.forEach(app => {
            const [startHour, startMin] = app.startTime.split(':').map(Number);
            
            if (startHour === hour && startMin === 0) {
              morningSlot.status = 'booked';
              morningSlot.appointmentId = app._id;
              morningSlot.clientName = app.customer?.name || 'Client';
              morningSlot.service = app.service?.name || 'Service';
            }
            
            if (startHour === hour && startMin === 30) {
              afternoonSlot.status = 'booked';
              afternoonSlot.appointmentId = app._id;
              afternoonSlot.clientName = app.customer?.name || 'Client';
              afternoonSlot.service = app.service?.name || 'Service';
            }
          });
          
          timeSlots.push(morningSlot);
          timeSlots.push(afternoonSlot);
        }
        
        // Format appointment history from real data
        const history = appointments.map(app => ({
          id: app._id,
          date: new Date(app.date),
          formattedDate: format(new Date(app.date), 'MMM dd, yyyy HH:mm'),
          client: app.customer?.name || 'Unknown Client',
          barber: app.barber?.name || 'Unknown Barber',
          service: app.service?.name || 'Unknown Service',
          serviceType: app.service?.category || 'Unknown Type',
          price: app.service?.price || 0,
          status: app.status
        }));
        
        // Sort by date (newest first)
        history.sort((a, b) => b.date - a.date);
        
        setBarberStats({
          barberId,
          appointmentsCount: barberStatsData.appointmentsCount || 0,
          clientsCount: barberStatsData.clientsCount || 0,
          revenue: barberStatsData.revenue || 0,
          timeSlots,
          utilization: barberStatsData.utilization || 0,
          clientRetention: barberStatsData.clientRetention || 0,
          averageRating: barberStatsData.averageRating || '0.0'
        });
        
        setAppointmentHistory(history);
      } else {
        console.error('Failed to fetch barber stats:', statsResponse.data, appointmentsResponse.data);
        Alert.alert('Error', 'Failed to load barber statistics.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching barber stats:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load barber statistics. Please try again.');
    }
  };

  // View barber details
  const handleViewDetails = (barber) => {
    setSelectedBarber(barber);
    fetchBarberStats(barber._id);
  };

  // Show appointment details modal
  const showAppointmentDetails = () => {
    setDetailsVisible(true);
  };

  // Render barber card
  const renderBarberItem = ({ item }) => (
    <Card 
      style={[
        styles.barberCard, 
        selectedBarber?._id === item._id ? styles.selectedBarberCard : null
      ]}
      onPress={() => handleViewDetails(item)}
    >
      <Card.Content style={styles.barberCardContent}>
        <Avatar.Image 
          size={50} 
          source={{ uri: item.profileImage || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
        />
        <View style={styles.barberInfo}>
          <Title style={styles.barberName}>{item.name}</Title>
          <Paragraph>{item.specialties?.join(', ') || 'General Barber'}</Paragraph>
        </View>
      </Card.Content>
    </Card>
  );

  // Render time slot
  const renderTimeSlot = ({ item }) => (
    <View style={[styles.timeSlot, item.status === 'booked' ? styles.bookedSlot : styles.freeSlot]}>
      <Text style={styles.timeSlotTime}>{item.time}</Text>
      {item.status === 'booked' ? (
        <View style={styles.timeSlotBookingInfo}>
          <Text style={styles.timeSlotClientName}>{item.clientName}</Text>
          <Text style={styles.timeSlotService}>{item.service}</Text>
          {item.serviceType && <Text style={styles.timeSlotServiceType}>{item.serviceType}</Text>}
        </View>
      ) : (
        <Text style={styles.timeSlotStatus}>Free</Text>
      )}
    </View>
  );

  if (loading && !barbers.length) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0F4C75" />
        <Text style={{ marginTop: 20 }}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Manager Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manager Dashboard</Text>
        <Text style={styles.headerSubtitle}>Staff Monitoring</Text>
      </View>
      
      {/* Salon Dashboard Button */}
      <Button 
        mode="contained" 
        icon="store"
        onPress={() => navigation.navigate('SalonDashboard')}
        style={styles.salonButton}
      >
        Salon Dashboard
      </Button>

      <ScrollView style={styles.content}>
        {/* Date Filter */}
        <View style={styles.dateFilterContainer}>
          <Text style={styles.sectionTitle}>Statistics Period:</Text>
          <View style={styles.dateFilterButtons}>
            <Button 
              mode={dateFilter === 'day' ? 'contained' : 'outlined'} 
              onPress={() => setDateFilter('day')}
              style={styles.dateFilterButton}
            >
              Day
            </Button>
            <Button 
              mode={dateFilter === 'week' ? 'contained' : 'outlined'} 
              onPress={() => setDateFilter('week')}
              style={styles.dateFilterButton}
            >
              Week
            </Button>
            <Button 
              mode={dateFilter === 'month' ? 'contained' : 'outlined'} 
              onPress={() => setDateFilter('month')}
              style={styles.dateFilterButton}
            >
              Month
            </Button>
          </View>
        </View>

        {/* Barber Selection */}
        <Text style={styles.sectionTitle}>Your Staff:</Text>
        <FlatList
          data={barbers}
          renderItem={renderBarberItem}
          keyExtractor={item => item._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.barberList}
        />

        {/* Selected Barber Stats */}
        {selectedBarber && barberStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.barberStatsTitle}>Statistics for {selectedBarber.name}</Text>
            
            {/* Stats Cards */}
            <View style={styles.statsCards}>
              <Card style={[styles.statsCard, { backgroundColor: '#E3F2FD' }]}>
                <Card.Content>
                  <Paragraph>Appointments</Paragraph>
                  <Title style={styles.statsValue}>{barberStats.appointmentsCount}</Title>
                </Card.Content>
              </Card>
              
              <Card style={[styles.statsCard, { backgroundColor: '#E8F5E9' }]}>
                <Card.Content>
                  <Paragraph>Clients</Paragraph>
                  <Title style={styles.statsValue}>{barberStats.clientsCount}</Title>
                </Card.Content>
              </Card>
              
              <Card style={[styles.statsCard, { backgroundColor: '#FFF8E1' }]}>
                <Card.Content>
                  <Paragraph>Revenue</Paragraph>
                  <Title style={styles.statsValue}>${barberStats.revenue}</Title>
                </Card.Content>
              </Card>
            </View>
            
            {/* Performance Metrics */}
            <Card style={styles.metricsCard}>
              <Card.Content>
                <Title style={styles.metricsTitle}>Performance Metrics</Title>
                
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Utilization</Text>
                  <Text style={styles.metricValue}>{barberStats.utilization}%</Text>
                </View>
                <ProgressBar progress={barberStats.utilization / 100} color="#2196F3" style={styles.progressBar} />
                
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Client Retention</Text>
                  <Text style={styles.metricValue}>{barberStats.clientRetention}%</Text>
                </View>
                <ProgressBar progress={barberStats.clientRetention / 100} color="#4CAF50" style={styles.progressBar} />
                
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Average Rating</Text>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.metricValue}>{barberStats.averageRating}</Text>
                    <Ionicons name="star" size={16} color="#FFC107" style={styles.starIcon} />
                  </View>
                </View>
              </Card.Content>
            </Card>
            
            {/* Schedule Today */}
            <Card style={styles.scheduleCard}>
              <Card.Content>
                <View style={styles.scheduleHeader}>
                  <Title style={styles.scheduleTitle}>Today's Schedule</Title>
                  <Text style={styles.scheduleDate}>{format(new Date(), 'MMMM d, yyyy')}</Text>
                </View>
                
                <FlatList
                  data={barberStats.timeSlots}
                  renderItem={renderTimeSlot}
                  keyExtractor={(item, index) => `time-${index}`}
                  style={styles.timeSlotList}
                  scrollEnabled={false}
                />
              </Card.Content>
            </Card>
            
            {/* Recent Appointments */}
            <Card style={styles.appointmentsCard}>
              <Card.Content>
                <View style={styles.appointmentsHeader}>
                  <Title style={styles.appointmentsTitle}>Recent Appointments</Title>
                  <Button mode="text" onPress={showAppointmentDetails}>
                    See All
                  </Button>
                </View>
                
                {appointmentHistory.slice(0, 5).map((appointment, index) => (
                  <View key={appointment.id} style={styles.appointmentItem}>
                    <View style={styles.appointmentInfo}>
                      <Text style={styles.appointmentClient}>{appointment.client}</Text>
                      <View style={styles.serviceRow}>
                        <Text style={styles.appointmentService}>{appointment.service}</Text>
                        <Text style={styles.appointmentServiceType}>
                          {appointment.serviceType !== 'Unknown Type' ? `(${appointment.serviceType})` : ''}
                        </Text>
                      </View>
                      <Text style={styles.appointmentDate}>{appointment.formattedDate}</Text>
                      <Text style={styles.appointmentBarber}>
                        Barber: {appointment.barber !== 'Unknown Barber' ? appointment.barber : 'Not assigned'}
                      </Text>
                    </View>
                    <Chip 
                      style={[
                        styles.statusChip,
                        appointment.status === 'completed' ? styles.completedChip : 
                        appointment.status === 'cancelled' ? styles.cancelledChip : styles.pendingChip
                      ]}
                      textStyle={styles.statusChipText}
                    >
                      {appointment.status.toUpperCase()}
                    </Chip>
                  </View>
                ))}
              </Card.Content>
            </Card>
          </View>
        )}
      </ScrollView>
      
      {/* Appointment Details Modal */}
      <Portal>
        <Modal
          visible={detailsVisible}
          onDismiss={() => setDetailsVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Title style={styles.modalTitle}>
            {selectedBarber?.name}'s Appointments
          </Title>
          
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Date</DataTable.Title>
              <DataTable.Title>Client</DataTable.Title>
              <DataTable.Title>Service</DataTable.Title>
              <DataTable.Title>Barber</DataTable.Title>
              <DataTable.Title numeric>Price</DataTable.Title>
              <DataTable.Title>Status</DataTable.Title>
            </DataTable.Header>
            
            <ScrollView style={{ maxHeight: 400 }}>
              {appointmentHistory.map((appointment) => (
                <DataTable.Row key={appointment.id}>
                  <DataTable.Cell>{format(appointment.date, 'MM/dd HH:mm')}</DataTable.Cell>
                  <DataTable.Cell>{appointment.client}</DataTable.Cell>
                  <DataTable.Cell>
                    {appointment.service}
                    <Text style={styles.serviceTypeText}>
                      {appointment.serviceType !== 'Unknown Type' ? `(${appointment.serviceType})` : ''}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>{appointment.barber !== 'Unknown Barber' ? appointment.barber : 'Not assigned'}</DataTable.Cell>
                  <DataTable.Cell numeric>${appointment.price}</DataTable.Cell>
                  <DataTable.Cell>
                    <Chip 
                      style={[
                        styles.smallChip,
                        appointment.status === 'completed' ? styles.completedChip : 
                        appointment.status === 'cancelled' ? styles.cancelledChip : styles.pendingChip
                      ]}
                      textStyle={styles.smallChipText}
                    >
                      {appointment.status.substr(0, 4).toUpperCase()}
                    </Chip>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </ScrollView>
          </DataTable>
          
          <Button 
            mode="contained" 
            onPress={() => setDetailsVisible(false)}
            style={styles.modalButton}
          >
            Close
          </Button>
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
    padding: 15,
  },
  dateFilterContainer: {
    marginBottom: 15,
  },
  dateFilterButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  dateFilterButton: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B262C',
    marginBottom: 10,
  },
  barberList: {
    paddingBottom: 15,
  },
  barberCard: {
    marginRight: 10,
    width: 200,
  },
  selectedBarberCard: {
    borderWidth: 2,
    borderColor: '#0F4C75',
  },
  barberCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barberInfo: {
    marginLeft: 10,
  },
  barberName: {
    fontSize: 16,
  },
  statsContainer: {
    marginTop: 15,
  },
  barberStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B262C',
    marginBottom: 15,
  },
  statsCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statsCard: {
    width: '31%',
    elevation: 2,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricsCard: {
    marginBottom: 15,
  },
  metricsTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  metricLabel: {
    fontSize: 14,
    color: '#555',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginLeft: 5,
  },
  scheduleCard: {
    marginBottom: 15,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scheduleTitle: {
    fontSize: 16,
  },
  scheduleDate: {
    fontSize: 14,
    color: '#666',
  },
  timeSlotList: {
    marginTop: 10,
  },
  timeSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeSlotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSlotTime: {
    fontSize: 14,
  },
  timeSlotDetails: {
    marginLeft: 10,
  },
  timeSlotClient: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeSlotService: {
    fontSize: 12,
    color: '#555',
  },
  statusChip: {
    height: 30,
  },
  bookedChip: {
    backgroundColor: '#FFECB3',
  },
  freeChip: {
    backgroundColor: '#C8E6C9',
  },
  bookedChipText: {
    color: '#F57C00',
  },
  freeChipText: {
    color: '#388E3C',
  },
  completedChip: {
    backgroundColor: '#C8E6C9',
  },
  cancelledChip: {
    backgroundColor: '#FFCDD2',
  },
  pendingChip: {
    backgroundColor: '#E1F5FE',
  },
  statusChipText: {
    fontSize: 10,
  },
  appointmentsCard: {
    marginBottom: 15,
  },
  appointmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  appointmentsTitle: {
    fontSize: 16,
  },
  appointmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentClient: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  appointmentService: {
    fontSize: 13,
    color: '#555',
  },
  appointmentDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
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
  modalButton: {
    marginTop: 20,
  },
  smallChip: {
    height: 24,
  },
  smallChipText: {
    fontSize: 8,
  },
  salonButton: {
    margin: 15,
    marginTop: 5,
  },
  timeSlotBookingInfo: {
    marginLeft: 10,
  },
  timeSlotClientName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeSlotServiceType: {
    fontSize: 12,
    color: '#555',
  },
  timeSlotStatus: {
    fontSize: 12,
    color: '#555',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentBarber: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  serviceTypeText: {
    fontSize: 10,
    color: '#888',
    marginLeft: 4,
  },
});

export default ManagerDashboardScreen; 