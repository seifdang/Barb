import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator, Chip, Searchbar, ProgressBar, Avatar, DataTable } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width - 40;

const SalonDashboardScreen = ({ route, navigation }) => {
  const { salonId } = route.params || {};
  const { userInfo } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState(null);
  const [salonStats, setSalonStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [dateFilter, setDateFilter] = useState('week'); // 'day', 'week', 'month'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'customers', 'appointments'
  
  // Fetch salon data on component mount
  useEffect(() => {
    fetchSalon();
  }, [salonId]);
  
  // Fetch stats when date filter changes
  useEffect(() => {
    if (salon) {
      fetchSalonStats();
    }
  }, [dateFilter, salon]);
  
  // Fetch salon details
  const fetchSalon = async () => {
    try {
      setLoading(true);
      
      // If no salonId passed, fetch the manager's salons and use the first one
      if (!salonId) {
        const salonsResponse = await apiClient.get('/manager/salons', {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        });
        
        if (salonsResponse.data && salonsResponse.data.success && salonsResponse.data.salons.length > 0) {
          setSalon(salonsResponse.data.salons[0]);
          fetchSalonStats(salonsResponse.data.salons[0]._id);
          fetchSalonCustomers(salonsResponse.data.salons[0]._id);
        } else {
          Alert.alert('Error', 'No salons found for this manager');
          setLoading(false);
          return;
        }
      } else {
        // Fetch specific salon
        const response = await apiClient.get(`/salons/${salonId}`, {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        });
        
        if (response.data && response.data.success) {
          setSalon(response.data.salon);
          fetchSalonStats(salonId);
          fetchSalonCustomers(salonId);
        } else {
          Alert.alert('Error', 'Failed to load salon details');
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching salon:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load salon: ' + (error.message || 'Unknown error'));
    }
  };
  
  // Fetch salon statistics
  const fetchSalonStats = async (id = salonId) => {
    try {
      setLoading(true);
      const targetId = id || salon._id;
      
      const response = await apiClient.get(`/manager/salon/${targetId}/stats?period=${dateFilter}`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });
      
      if (response.data && response.data.success) {
        setSalonStats(response.data.stats);
      } else {
        Alert.alert('Error', 'Failed to load salon statistics');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching salon stats:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load salon statistics: ' + (error.message || 'Unknown error'));
    }
  };
  
  // Fetch salon customers
  const fetchSalonCustomers = async (id = salonId) => {
    try {
      const targetId = id || salon._id;
      
      const response = await apiClient.get(`/manager/salon/${targetId}/customers`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });
      
      if (response.data && response.data.success) {
        setCustomers(response.data.customers);
      } else {
        console.error('Failed to load customers:', response.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };
  
  // Format data for charts
  const getChartData = () => {
    if (!salonStats || !salonStats.dailyAppointments) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }]
      };
    }
    
    // Sort dates
    const dates = Object.keys(salonStats.dailyAppointments).sort();
    
    // Get last 7 dates for display
    const recentDates = dates.slice(-7);
    
    return {
      labels: recentDates.map(date => {
        const [year, month, day] = date.split('-');
        return `${month}/${day}`;
      }),
      datasets: [{
        data: recentDates.map(date => salonStats.dailyAppointments[date] || 0)
      }]
    };
  };
  
  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchQuery))
  );
  
  // Render customer item
  const renderCustomerItem = ({ item }) => (
    <Card style={styles.customerCard}>
      <Card.Content style={styles.customerCardContent}>
        <View style={styles.customerInfo}>
          <Title style={styles.customerName}>{item.name}</Title>
          <Paragraph>{item.email}</Paragraph>
          <Paragraph>{item.phone || 'No phone'}</Paragraph>
          
          <View style={styles.customerMetrics}>
            <Chip style={styles.customerMetric}>Visits: {item.visits}</Chip>
            <Chip style={styles.customerMetric}>Spent: ${item.totalSpent}</Chip>
          </View>
          
          {item.lastVisit && (
            <Paragraph style={styles.lastVisit}>
              Last visit: {format(new Date(item.lastVisit), 'MMM dd, yyyy')}
            </Paragraph>
          )}
        </View>
      </Card.Content>
    </Card>
  );
  
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
  
  if (loading && !salon) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0F4C75" />
        <Text style={{ marginTop: 20 }}>Loading salon dashboard...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Salon Dashboard</Text>
        {salon && <Text style={styles.headerSubtitle}>{salon.name}</Text>}
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]} 
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Stats
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'customers' && styles.activeTab]} 
          onPress={() => setActiveTab('customers')}
        >
          <Text style={[styles.tabText, activeTab === 'customers' && styles.activeTabText]}>
            Customers
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'appointments' && styles.activeTab]} 
          onPress={() => setActiveTab('appointments')}
        >
          <Text style={[styles.tabText, activeTab === 'appointments' && styles.activeTabText]}>
            Staff
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Stats Tab Content */}
        {activeTab === 'stats' && (
          <>
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
            
            {/* Main Stats Cards */}
            {salonStats && (
              <View style={styles.statsContainer}>
                <View style={styles.statsCards}>
                  <Card style={[styles.statsCard, { backgroundColor: '#E3F2FD' }]}>
                    <Card.Content>
                      <Paragraph>Appointments</Paragraph>
                      <Title style={styles.statsValue}>{salonStats.appointmentsCount}</Title>
                    </Card.Content>
                  </Card>
                  
                  <Card style={[styles.statsCard, { backgroundColor: '#E8F5E9' }]}>
                    <Card.Content>
                      <Paragraph>Customers</Paragraph>
                      <Title style={styles.statsValue}>{salonStats.clientsCount}</Title>
                    </Card.Content>
                  </Card>
                  
                  <Card style={[styles.statsCard, { backgroundColor: '#FFF8E1' }]}>
                    <Card.Content>
                      <Paragraph>Revenue</Paragraph>
                      <Title style={styles.statsValue}>${salonStats.revenue}</Title>
                    </Card.Content>
                  </Card>
                </View>
                
                {/* Appointments Chart */}
                <Card style={styles.chartCard}>
                  <Card.Content>
                    <Title style={styles.chartTitle}>Daily Appointments</Title>
                    <BarChart
                      data={getChartData()}
                      width={screenWidth}
                      height={220}
                      yAxisLabel=""
                      chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(15, 76, 117, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                          borderRadius: 16
                        }
                      }}
                      style={styles.chart}
                    />
                  </Card.Content>
                </Card>
                
                {/* Status Breakdown */}
                <Card style={styles.statusCard}>
                  <Card.Content>
                    <Title style={styles.statusTitle}>Appointment Status</Title>
                    
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Pending</Text>
                      <Text style={styles.statusValue}>{salonStats.statusCounts.pending}</Text>
                    </View>
                    <ProgressBar 
                      progress={salonStats.appointmentsCount > 0 ? salonStats.statusCounts.pending / salonStats.appointmentsCount : 0} 
                      color="#FFC107" 
                      style={styles.progressBar} 
                    />
                    
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Confirmed</Text>
                      <Text style={styles.statusValue}>{salonStats.statusCounts.confirmed}</Text>
                    </View>
                    <ProgressBar 
                      progress={salonStats.appointmentsCount > 0 ? salonStats.statusCounts.confirmed / salonStats.appointmentsCount : 0} 
                      color="#2196F3" 
                      style={styles.progressBar} 
                    />
                    
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Completed</Text>
                      <Text style={styles.statusValue}>{salonStats.statusCounts.completed}</Text>
                    </View>
                    <ProgressBar 
                      progress={salonStats.appointmentsCount > 0 ? salonStats.statusCounts.completed / salonStats.appointmentsCount : 0} 
                      color="#4CAF50" 
                      style={styles.progressBar} 
                    />
                    
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Cancelled</Text>
                      <Text style={styles.statusValue}>{salonStats.statusCounts.cancelled}</Text>
                    </View>
                    <ProgressBar 
                      progress={salonStats.appointmentsCount > 0 ? salonStats.statusCounts.cancelled / salonStats.appointmentsCount : 0} 
                      color="#F44336" 
                      style={styles.progressBar} 
                    />
                  </Card.Content>
                </Card>
              </View>
            )}
          </>
        )}
        
        {/* Customers Tab Content */}
        {activeTab === 'customers' && (
          <>
            <Searchbar
              placeholder="Search customers..."
              onChangeText={query => setSearchQuery(query)}
              value={searchQuery}
              style={styles.searchBar}
            />
            
            <Text style={styles.customerCount}>
              {filteredCustomers.length} {filteredCustomers.length === 1 ? 'Customer' : 'Customers'}
            </Text>
            
            {filteredCustomers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No customers found</Text>
              </View>
            ) : (
              filteredCustomers.map(customer => renderCustomerItem({ item: customer }))
            )}
          </>
        )}
        
        {/* Staff Tab Content */}
        {activeTab === 'appointments' && salon && (
          <>
            <Text style={styles.sectionTitle}>Staff Members</Text>
            
            {salon.staff && salon.staff.length > 0 ? (
              <View style={styles.staffContainer}>
                {salon.staff.map(staff => (
                  <Card key={staff._id} style={styles.staffCard}>
                    <Card.Content style={styles.staffCardContent}>
                      <Avatar.Image 
                        size={50} 
                        source={{ uri: staff.profileImage || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
                      />
                      <View style={styles.staffInfo}>
                        <Title style={styles.staffName}>{staff.name}</Title>
                        <Paragraph>{staff.role}</Paragraph>
                        <View style={styles.specialtiesContainer}>
                          {staff.specialties?.map((specialty, idx) => (
                            <Chip key={idx} style={styles.specialtyChip}>{specialty}</Chip>
                          ))}
                        </View>
                      </View>
                    </Card.Content>
                    <Card.Actions>
                      <Button onPress={() => navigation.navigate('ManagerDashboard', { barber: staff })}>
                        View Performance
                      </Button>
                    </Card.Actions>
                  </Card>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No staff members found for this salon</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
    fontSize: 18,
    color: '#BBE1FA',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0F4C75',
  },
  tabText: {
    fontSize: 16,
    color: '#555',
  },
  activeTabText: {
    color: '#0F4C75',
    fontWeight: 'bold',
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
  statsContainer: {
    marginBottom: 20,
  },
  statsCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statsCard: {
    flex: 1,
    marginRight: 10,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartCard: {
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statusCard: {
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 15,
  },
  searchBar: {
    marginBottom: 15,
    elevation: 1,
  },
  customerCount: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  customerCard: {
    marginBottom: 10,
  },
  customerCardContent: {
    flexDirection: 'row',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
  },
  customerMetrics: {
    flexDirection: 'row',
    marginTop: 10,
  },
  customerMetric: {
    marginRight: 8,
  },
  lastVisit: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
  },
  staffContainer: {
    marginBottom: 20,
  },
  staffCard: {
    marginBottom: 10,
  },
  staffCardContent: {
    flexDirection: 'row',
  },
  staffInfo: {
    marginLeft: 15,
    flex: 1,
  },
  staffName: {
    fontSize: 16,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  specialtyChip: {
    marginRight: 5,
    marginBottom: 5,
    backgroundColor: '#E1F5FE',
  },
  appointmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  appointmentClient: {
    flex: 1,
    fontSize: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentService: {
    fontSize: 16,
  },
  appointmentServiceType: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  appointmentDate: {
    fontSize: 14,
    color: '#555',
  },
  appointmentBarber: {
    fontSize: 14,
    color: '#555',
  },
  serviceTypeText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default SalonDashboardScreen; 