import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';
import { servicesApi, appointmentsApi } from '../../api/client';
import { AuthContext } from '../../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { userInfo } = useContext(AuthContext);
  
  useEffect(() => {
    // Fetch data when component mounts
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch featured services
        const servicesResponse = await servicesApi.getServices();
        const featuredServices = servicesResponse.data.services.slice(0, 3); // Get first 3 services
        
        // Fetch user's upcoming appointments
        const appointmentsResponse = await appointmentsApi.getUserAppointments();
        const upcomingAppointments = appointmentsResponse.data.appointments
          .filter(app => app.status === 'confirmed' || app.status === 'pending')
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 2); // Get next 2 appointments
        
        setServices(featuredServices);
        setAppointments(upcomingAppointments);
        
      } catch (error) {
        console.error('Error fetching home data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F4C75" />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}>
          Retry
        </Button>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {userInfo?.name?.split(' ')[0] || 'there'}! 👋</Text>
        <Text style={styles.subGreeting}>Ready for a fresh cut?</Text>
      </View>
      
      {/* Upcoming Appointments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {appointments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Paragraph>You don't have any upcoming appointments.</Paragraph>
              <Button 
                mode="contained" 
                style={styles.bookButton}
                onPress={() => navigation.navigate('Services')}
              >
                Book Now
              </Button>
            </Card.Content>
          </Card>
        ) : (
          appointments.map(appointment => (
            <Card key={appointment._id} style={styles.card}>
              <Card.Content>
                <Title>{appointment.service.name}</Title>
                <Paragraph>
                  Date: {new Date(appointment.date).toLocaleDateString()}
                </Paragraph>
                <Paragraph>
                  Time: {appointment.startTime} - {appointment.endTime}
                </Paragraph>
                <Paragraph>
                  Barber: {appointment.barber.name}
                </Paragraph>
                <View style={styles.statusContainer}>
                  <Text style={[
                    styles.status, 
                    { 
                      backgroundColor: 
                        appointment.status === 'confirmed' ? '#4CAF50' : 
                        appointment.status === 'pending' ? '#FFC107' : '#F44336'
                    }
                  ]}>
                    {appointment.status.toUpperCase()}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </View>
      
      {/* Our Services */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Services')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {services.map(service => (
            <Card key={service._id} style={styles.horizontalCard}>
              <Card.Cover 
                source={{ uri: service.image || 'https://via.placeholder.com/150' }} 
                style={styles.serviceImage}
              />
              <Card.Content>
                <Title>{service.name}</Title>
                <Paragraph numberOfLines={2}>{service.description}</Paragraph>
                <Paragraph style={styles.price}>${service.price}</Paragraph>
              </Card.Content>
              <Card.Actions>
                <Button 
                  mode="contained" 
                  onPress={() => navigation.navigate('Booking', { service })}
                >
                  Book
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </ScrollView>
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
  errorText: {
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#0F4C75',
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subGreeting: {
    fontSize: 16,
    color: '#BBE1FA',
    marginTop: 5,
  },
  section: {
    marginVertical: 15,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B262C',
  },
  seeAll: {
    color: '#3282B8',
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
  },
  emptyCard: {
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
    alignItems: 'center',
    padding: 10,
  },
  bookButton: {
    marginTop: 10,
  },
  horizontalCard: {
    width: 220,
    marginRight: 15,
    borderRadius: 10,
    elevation: 2,
  },
  serviceImage: {
    height: 120,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  price: {
    fontWeight: 'bold',
    color: '#0F4C75',
    marginTop: 5,
  },
  statusContainer: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 