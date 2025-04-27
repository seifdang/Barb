import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, Title, Paragraph, ActivityIndicator, Divider, Avatar, Chip } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { barbersApi, appointmentsApi, servicesApi } from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { CommonActions } from '@react-navigation/native';
import { navigationRef, navigateToTab } from '../../App';

const BookingScreen = ({ route, navigation }) => {
  const { service } = route.params;
  
  const [salons, setSalons] = useState([]);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [allTimeSlots, setAllTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1 = select salon, 2 = select barber, 3 = select date, 4 = select time
  
  const { userInfo } = useContext(AuthContext);
  
  // Time slots from 9 AM to 6 PM
  const defaultTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');
  
  // Fetch salons on component mount
  useEffect(() => {
    fetchSalons();
  }, []);
  
  // Fetch barbers when salon is selected
  useEffect(() => {
    if (selectedSalon) {
      fetchBarbersBySalon(selectedSalon._id);
    }
  }, [selectedSalon]);
  
  // Fetch available time slots when barber or date changes
  useEffect(() => {
    if (selectedBarber && selectedDate) {
      fetchAvailableTimes();
    } else {
      // Reset time slots when barber or date is not selected
      const timeSlots = [...defaultTimeSlots];
      setAllTimeSlots(timeSlots);
      setAvailableTimes([]);
    }
  }, [selectedBarber, selectedDate]);
  
  const fetchSalons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/salons', {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`
        }
      });
      
      if (response.data && response.data.success) {
        setSalons(response.data.salons);
        console.log(`Loaded ${response.data.salons.length} salons`);
      } else {
        throw new Error('Failed to fetch salons');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching salons:', error);
      setError('Failed to load salons. Please try again.');
      setLoading(false);
      Alert.alert('Error', 'Failed to load salons. Please try again later.');
    }
  };
  
  const fetchBarbersBySalon = async (salonId) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching barbers for salon ID: ${salonId}`);
      
      // APPROACH: Fetch the full user list first, then filter by the salon's staff IDs
      // This is more reliable than expecting populated staff objects
      
      // Step 1: Get salon details to get staff IDs
      const salonResponse = await apiClient.get(`/salons/${salonId}`, {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`
        }
      });
      
      if (!salonResponse.data || !salonResponse.data.success) {
        throw new Error('Failed to fetch salon details');
      }
      
      const salonData = salonResponse.data.salon;
      console.log(`Loaded salon: ${salonData.name}`);
      
      // Check if staff property exists
      if (!salonData.staff || !Array.isArray(salonData.staff) || salonData.staff.length === 0) {
        console.log('No staff array found in salon data or it is empty');
        setBarbers([]);
        setError('No barbers available for this salon. Staff not assigned.');
        setLoading(false);
        setStep(2); // Still move to next step to show empty state
        return;
      }
      
      // Step 2: Extract all staff IDs (whether objects or plain IDs)
      const staffIds = salonData.staff.map(staff => 
        typeof staff === 'object' ? staff._id : staff
      );
      
      console.log(`Found ${salonData.staff.length} staff IDs`);
      
      // Step 3: Get all users and filter by staff IDs + barber role
      // Use the salon's staff directly if they are populated with user data
      let barberStaff = [];
      
      if (salonData.staff.every(staff => typeof staff === 'object' && staff.role)) {
        console.log('Staff objects are populated with role data, using directly');
        
        // Use the populated staff data directly
        barberStaff = salonData.staff.filter(staff => {
          const roleToCheck = (staff.role || '').toLowerCase();
          const isBarberRole = roleToCheck === 'barber' || 
                              roleToCheck.includes('barber') || 
                              roleToCheck === 'stylist';
          
          console.log(`Direct staff member check - ${staff.name}: role=${staff.role}, isBarber=${isBarberRole}`);
          return isBarberRole;
        });
      } else {
        // Need to fetch users from the admin endpoint
        try {
          console.log('Using admin endpoint to fetch users');
          const usersResponse = await apiClient.get('/admin/users', {
            headers: {
              Authorization: `Bearer ${userInfo?.token}`
            }
          });
          
          if (!usersResponse.data || !usersResponse.data.success) {
            throw new Error('Failed to fetch users');
          }
          
          const allUsers = usersResponse.data.users || [];
          console.log(`Fetched ${allUsers.length} total users from admin endpoint`);
          
          // Find users who are both in the salon's staff list AND have a barber/stylist role
          barberStaff = allUsers.filter(user => {
            // First check if this user is in the salon's staff list
            const isStaffMember = staffIds.includes(user._id);
            if (!isStaffMember) return false;
            
            // Then check role (with flexible matching)
            const roleToCheck = (user.role || '').toLowerCase();
            const isBarberRole = roleToCheck === 'barber' || 
                                roleToCheck.includes('barber') || 
                                roleToCheck === 'stylist';
            
            console.log(`Admin staff check - ${user.name}: role=${user.role}, isBarber=${isBarberRole}`);
            return isBarberRole;
          });
        } catch (error) {
          console.error('Error fetching from admin endpoint:', error);
          // Try a direct approach as fallback
          try {
            console.log('Trying direct staff ID lookup');
            // Fetch each staff member directly by ID
            barberStaff = [];
            for (const staffId of staffIds) {
              try {
                const userResponse = await apiClient.get(`/admin/users/${staffId}`, {
                  headers: {
                    Authorization: `Bearer ${userInfo?.token}`
                  }
                });
                
                if (userResponse.data && userResponse.data.success) {
                  const user = userResponse.data.user;
                  const roleToCheck = (user.role || '').toLowerCase();
                  const isBarberRole = roleToCheck === 'barber' || 
                                     roleToCheck.includes('barber') || 
                                     roleToCheck === 'stylist';
                                      
                  if (isBarberRole) {
                    barberStaff.push(user);
                    console.log(`Added staff member by ID: ${user.name}, role=${user.role}`);
                  }
                }
              } catch (err) {
                console.log(`Error fetching staff ID ${staffId}:`, err);
              }
            }
          } catch (fallbackError) {
            console.error('Error with fallback approach:', fallbackError);
          }
        }
      }
      
      console.log(`Found ${barberStaff.length} barbers for this salon`);
      
      if (barberStaff.length > 0) {
        setBarbers(barberStaff);
        console.log(`Loaded ${barberStaff.length} barbers for salon ${salonData.name}`);
      } else {
        setBarbers([]);
        setError('No barbers available for this salon. Staff exists but no barber roles found.');
        Alert.alert(
          'No Barbers', 
          'This salon does not have any barbers assigned. Please select another salon or use the debug button to check staff roles.'
        );
      }
      
      setLoading(false);
      setStep(2); // Move to next step
    } catch (error) {
      console.error('Error fetching barbers by salon:', error);
      setError('Failed to load barbers. Please try again.');
      Alert.alert('Error', 'Failed to load barbers: ' + (error.message || 'Unknown error'));
      setLoading(false);
      setStep(2); // Still move to next step to show error state
    }
  };
  
  const fetchAvailableTimes = async () => {
    if (!selectedBarber || !selectedDate) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Generate time slots from 9 AM to 5 PM
      const timeSlots = [];
      
      // Get current date and selected date for comparison
      const now = new Date();
      const selectedDateObj = new Date(selectedDate);
      const isToday = selectedDateObj.getDate() === now.getDate() && 
                      selectedDateObj.getMonth() === now.getMonth() && 
                      selectedDateObj.getFullYear() === now.getFullYear();
      
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Generate times from 9am to 5pm
      for (let hour = 9; hour <= 17; hour++) {
        for (let minute of [0, 30]) {
          // Skip times in the past if it's today
          if (isToday && (hour < currentHour || (hour === currentHour && minute <= currentMinute))) {
            continue;
          }
          
          const formattedHour = hour.toString().padStart(2, '0');
          const formattedMinute = minute.toString().padStart(2, '0');
          timeSlots.push(`${formattedHour}:${formattedMinute}`);
        }
      }
      
      // Set default time slots
      setAllTimeSlots(timeSlots);
      
      // If we have a barber, check their availability
      try {
        console.log('Fetching availability for:', {
          barberId: selectedBarber._id,
          date: selectedDate,
          salonId: selectedSalon._id
        });
        
        // Fetch existing appointments for the barber and date
        const response = await appointmentsApi.getBarberAvailability(
          selectedBarber._id, 
          selectedDate,
          selectedSalon._id
        );
        
        console.log('Availability response:', response?.data);
        
        if (response?.data && response.data.success) {
          // Set all time slots for display
          setAllTimeSlots(timeSlots);
          
          // Set available times from API
          const availableTimes = response.data.availableTimes || [];
          
          console.log('Available times from API:', availableTimes);
          
          // Filter availableTimes to ensure they're also in our valid timeSlots
          // (this ensures we don't show past times even if the API returns them)
          const filteredTimes = availableTimes.filter(time => 
            timeSlots.includes(time)
          );
          
          console.log('Filtered times:', filteredTimes);
          
          setAvailableTimes(filteredTimes);
          
          // If we were in step 4 (time selection) but no times are available,
          // automatically go back to date selection
          if (step === 4 && filteredTimes.length === 0) {
            setSelectedTime(null);
          }
          // If we had a selected time but it's no longer available, clear it
          else if (selectedTime && !filteredTimes.includes(selectedTime)) {
            setSelectedTime(null);
          }
        } else {
          console.error('API error response or no response data:', response?.data);
          // FALLBACK: Use all time slots if API fails to return available times
          console.log('Using fallback time slots due to API error');
          setAllTimeSlots(timeSlots);
          setAvailableTimes(timeSlots);
        }
      } catch (error) {
        console.error('Error fetching barber availability:', error);
        console.log('Using fallback time slots due to error');
        // FALLBACK: Use all time slots if API call fails
        setAllTimeSlots(timeSlots);
        setAvailableTimes(timeSlots);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchAvailableTimes:', error);
      setLoading(false);
      
      // FALLBACK: Generate time slots locally as a last resort
      const fallbackTimeSlots = [];
      for (let hour = 9; hour <= 17; hour++) {
        fallbackTimeSlots.push(`${hour}:00`);
        fallbackTimeSlots.push(`${hour}:30`);
      }
      setAllTimeSlots(fallbackTimeSlots);
      setAvailableTimes(fallbackTimeSlots);
    }
  };
  
  // Helper function to convert decimal hours to HH:MM format
  const formatTimeFromHours = (decimalHours) => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };
  
  // Helper function to convert HH:MM to decimal hours
  const getDecimalHours = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + (minutes / 60);
  };
  
  // Calculate end time based on selected time and service duration
  const getEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startHours = hours + (minutes / 60);
    const endHours = startHours + (service.duration / 60);
    return formatTimeFromHours(endHours);
  };
  
  const handleSalonSelect = (salon) => {
    setSelectedSalon(salon);
    setSelectedBarber(null);
    setSelectedDate('');
    setSelectedTime('');
    // Next step will be triggered by useEffect when barbers are loaded
  };
  
  const handleBarberSelect = (barber) => {
    setSelectedBarber(barber);
    setStep(3); // Move to date selection
  };
  
  const handleDateSelect = (date) => {
    // Check if the selected date is not in the past
    const selectedDateObj = new Date(date.dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    if (selectedDateObj < today) {
      Alert.alert(
        "Invalid Date", 
        "You cannot book appointments in the past. Please select today or a future date."
      );
      return;
    }
    
    setSelectedDate(date.dateString);
    setStep(4); // Move to time selection
  };
  
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };
  
  const handleBooking = async () => {
    // Basic validation
    if (!selectedBarber || !selectedDate || !selectedTime || !selectedSalon) {
      Alert.alert('Error', 'Please complete all booking details');
      return;
    }

    try {
      setSubmitting(true);
      console.log("Starting booking process...");
      
      // Calculate end time
      const serviceDuration = service.duration || 30;
      const [hour, minute] = selectedTime.split(':').map(Number);
      let endHour = hour;
      let endMinute = minute + serviceDuration;
      
      // Adjust hour if minutes overflow
      if (endMinute >= 60) {
        endHour += Math.floor(endMinute / 60);
        endMinute = endMinute % 60;
      }
      
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // Format booking data
      const bookingData = {
        barberId: selectedBarber._id,
        serviceId: service._id,
        salonId: selectedSalon._id,
        date: selectedDate,
        startTime: selectedTime,
        endTime: endTime
      };
      
      console.log('Booking data:', bookingData);
      
      // Simple direct API call
      const response = await apiClient.post('/appointments', bookingData, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      
      setSubmitting(false);
      
      console.log('BOOKING SUCCESS! Response:', response?.data);
      
      if (response?.data?.success) {
        console.log('BOOKING SUCCESS! Response:', response?.data);
        
        // Set a flag for successful booking
        const bookingSuccess = true;
        
        // First just go back - this is the most reliable approach
        setTimeout(() => {
          try {
            console.log('Navigating back to previous screen');
            navigation.goBack();
            
            // Then show success alert
            setTimeout(() => {
              Alert.alert(
                'Booking Confirmed!',
                `Your appointment with ${selectedBarber.name} on ${format(new Date(selectedDate), 'MMMM d')} at ${selectedTime} has been booked successfully.`,
                [{ text: 'OK' }]
              );
            }, 100);
          } catch (navError) {
            console.error('Navigation error:', navError);
            // If navigation fails, at least show the success message
            Alert.alert(
              'Booking Confirmed!',
              `Your appointment with ${selectedBarber.name} on ${format(new Date(selectedDate), 'MMMM d')} at ${selectedTime} has been booked successfully.`,
              [{ text: 'OK' }]
            );
          }
        }, 100);
      } else {
        throw new Error(response?.data?.message || 'Unknown booking error');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setSubmitting(false);
      Alert.alert('Error', error.message || 'Failed to book appointment. Please try again.');
    }
  };
  
  // Debug button
  const debugSalonAndStaff = async (salonId) => {
    try {
      console.log(`Debug: Fetching detailed data for salon ${salonId}`);
      
      // Fetch salon details
      const salonResponse = await apiClient.get(`/salons/${salonId}`, {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`
        }
      });
      
      const salonData = salonResponse.data;
      console.log('Raw salon data:', JSON.stringify(salonData));
      
      // Get staff IDs
      let staffIds = [];
      let staffDetails = '';
      
      if (salonData.salon && salonData.salon.staff) {
        console.log('Staff array length:', salonData.salon.staff.length);
        console.log('Staff array type:', typeof salonData.salon.staff);
        console.log('Staff array:', JSON.stringify(salonData.salon.staff));
        
        // Extract staff IDs
        staffIds = salonData.salon.staff.map(staff => 
          typeof staff === 'object' ? staff._id : staff
        );
        
        // Log staff members
        salonData.salon.staff.forEach((staffMember, idx) => {
          console.log(`Staff #${idx}:`, JSON.stringify(staffMember));
          if (typeof staffMember === 'object') {
            const role = staffMember.role || 'unknown';
            staffDetails += `${idx+1}. ${staffMember.name}: role=${role}\n`;
          } else {
            staffDetails += `${idx+1}. ID only: ${staffMember}\n`;
          }
        });
      }
      
      // Always fetch all users to compare
      try {
        const usersResponse = await apiClient.get('/users', {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`
          }
        });
        
        const usersData = usersResponse.data;
        
        if (usersData.success && usersData.users) {
          // Find users who are in this salon's staff
          const salonStaff = usersData.users.filter(user => 
            staffIds.includes(user._id)
          );
          
          console.log(`Found ${salonStaff.length} staff members through user lookup`);
          
          // Count barbers specifically
          const potentialBarbers = salonStaff.filter(user => {
            const roleCheck = (user.role || '').toLowerCase();
            const isBarber = roleCheck === 'barber' || 
                           roleCheck.includes('barber') || 
                           roleCheck === 'stylist';
            console.log(`User ${user.name}, role=${user.role}, isBarber=${isBarber}`);
            return isBarber;
          });
          
          console.log(`Found ${potentialBarbers.length} potential barbers`);
          
          salonStaff.forEach((staff, idx) => {
            const role = staff.role || 'unknown';
            const isValidBarber = (role.toLowerCase() === 'barber' || 
                                 role.toLowerCase().includes('barber') || 
                                 role.toLowerCase() === 'stylist');
            staffDetails += `${idx+1}. ${staff.name}: role=${role} (${isValidBarber ? 'Valid Barber' : 'Not a Barber'})\n`;
          });
        }
      } catch (userError) {
        console.error('Error fetching users for debug:', userError);
        staffDetails += '(Error fetching user details)\n';
      }
      
      // Show alert with details
      Alert.alert(
        'Debug Info', 
        `Salon: ${salonData.salon.name}\n` +
        `Staff count: ${salonData.salon.staff ? salonData.salon.staff.length : 0}\n\n` +
        `Staff:\n${staffDetails || 'No staff details available'}`
      );
    } catch (err) {
      console.error('Debug fetch error:', err);
      Alert.alert('Debug Error', err.toString());
    }
  };
  
  // Test navigation function
  const testNavigation = () => {
    console.log('Testing navigation to Appointments screen');
    try {
      navigation.navigate('Appointments');
      console.log('Navigation successful');
    } catch (error) {
      console.error('Navigation error:', error);
      
      // Try alternative navigation
      try {
        console.log('Trying alternative navigation');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Appointments' }],
        });
        console.log('Alternative navigation successful');
      } catch (resetError) {
        console.error('Alternative navigation error:', resetError);
        Alert.alert('Navigation Failed', 'Could not navigate to Appointments screen');
      }
    }
  };
  
  const renderSalonSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Salon</Text>
      {salons.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No salons available.</Text>
        </View>
      ) : (
        <View style={styles.salonList}>
          {salons.map(salon => (
            <TouchableOpacity
              key={salon._id}
              style={[
                styles.salonCard,
                selectedSalon && selectedSalon._id === salon._id ? styles.selectedSalonCard : null
              ]}
              onPress={() => handleSalonSelect(salon)}
            >
              <Avatar.Icon 
                size={60} 
                icon="store" 
                backgroundColor="#0F4C75" 
                style={styles.salonIcon}
              />
              <View style={styles.salonInfo}>
                <Title style={styles.salonName}>{salon.name}</Title>
                <Paragraph style={styles.salonAddress}>
                  {salon.address && salon.address.street ? (
                    <Text>{salon.address.street}, {salon.address.city}</Text>
                  ) : (
                    <Text>Address not available</Text>
                  )}
                </Paragraph>
                <Paragraph style={styles.salonPhone}>
                  <Text>{salon.phone || 'Phone not available'}</Text>
                </Paragraph>
              </View>
              {selectedSalon && selectedSalon._id === salon._id && (
                <View style={styles.selectedIndicator}>
                  <Chip mode="flat" style={styles.selectedChip}>Selected</Chip>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Debug button */}
      <View style={styles.debugContainer}>
        <Button
          mode="outlined"
          style={styles.debugButton}
          onPress={() => {
            if (salons && salons.length > 0) {
              const salonId = salons[0]._id;
              debugSalonAndStaff(salonId);
            } else {
              Alert.alert('Debug Info', 'No salons to debug');
            }
          }}
        >
          Debug Salon Data
        </Button>
      </View>
    </View>
  );
  
  const renderBarberSelection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Select Barber</Text>
        <Button 
          mode="outlined" 
          onPress={() => setStep(1)}
          compact
        >
          Change Salon
        </Button>
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : loading ? (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#0F4C75" />
          <Text style={styles.loadingText}>Loading barbers...</Text>
        </View>
      ) : barbers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No barbers available for this salon.</Text>
          <Button 
            mode="contained" 
            onPress={() => setStep(1)}
            style={styles.changeButton}
          >
            Select Different Salon
          </Button>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.barberScroll}>
          {barbers.map(barber => {
            // Calculate barber availability status
            const hasWorkSchedule = barber.workSchedule && barber.workSchedule.length > 0;
            const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
            const isWorkingToday = hasWorkSchedule && 
              barber.workSchedule.some(schedule => 
                schedule.day === today && schedule.isWorking
              );
            
            // Calculate barber's weekly schedule
            const weeklySchedule = [];
            const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            for (let i = 0; i < 7; i++) {
              const isWorking = hasWorkSchedule && 
                barber.workSchedule.some(schedule => 
                  schedule.day === i && schedule.isWorking
                );
              
              weeklySchedule.push({
                day: weekDays[i],
                isWorking
              });
            }
            
            return (
              <TouchableOpacity
                key={barber._id}
                style={[
                  styles.barberCard,
                  selectedBarber && selectedBarber._id === barber._id ? styles.selectedBarberCard : null
                ]}
                onPress={() => handleBarberSelect(barber)}
              >
                <Avatar.Image 
                  size={70} 
                  source={{ uri: barber.profileImage || 'https://via.placeholder.com/70' }} 
                  style={styles.barberImage}
                />
                <Text style={styles.barberName}>{barber.name}</Text>
                
                {/* Availability indicator */}
                <View style={styles.availabilityContainer}>
                  <View 
                    style={[
                      styles.availabilityDot, 
                      { backgroundColor: isWorkingToday ? '#4CAF50' : '#F44336' }
                    ]} 
                  />
                  <Text style={styles.availabilityText}>
                    {isWorkingToday ? 'Available Today' : 'Unavailable Today'}
                  </Text>
                </View>
                
                {/* Weekly availability */}
                <View style={styles.weeklySchedule}>
                  {weeklySchedule.map((day, index) => (
                    <View key={index} style={styles.dayIndicator}>
                      <Text style={styles.dayText}>{day.day}</Text>
                      <View 
                        style={[
                          styles.dayDot, 
                          { backgroundColor: day.isWorking ? '#4CAF50' : '#F44336' }
                        ]} 
                      />
                    </View>
                  ))}
                </View>
                
                {/* Specialties */}
                {barber.specialties && barber.specialties.length > 0 && (
                  <Text style={styles.specialties} numberOfLines={1}>
                    {barber.specialties.slice(0, 2).join(', ')}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
  
  const renderDateSelection = () => {
    // Get current date to disable past dates
    const today = new Date();
    const currentDateString = today.toISOString().split('T')[0];
    
    // Generate marked dates object - disable past dates
    const markedDates = {};
    
    // Mark selected date if there is one
    if (selectedDate) {
      markedDates[selectedDate] = { selected: true, selectedColor: '#0F4C75' };
    }
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <Button 
            mode="outlined" 
            onPress={() => setStep(2)}
            compact
          >
            Change Barber
          </Button>
        </View>
        
        <Calendar
          current={currentDateString}
          minDate={currentDateString}
          onDayPress={handleDateSelect}
          markedDates={markedDates}
          theme={{
            selectedDayBackgroundColor: '#0F4C75',
            todayTextColor: '#0F4C75',
            arrowColor: '#0F4C75',
          }}
        />
      </View>
    );
  };
  
  const renderTimeSelection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Select Time</Text>
        <Button 
          mode="outlined" 
          onPress={() => setStep(3)}
          compact
        >
          Change Date
        </Button>
      </View>
      
      {loading ? (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#0F4C75" />
          <Text style={styles.loadingText}>Loading available times...</Text>
        </View>
      ) : availableTimes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No available time slots for this date.</Text>
          <Text style={styles.emptySubText}>Try selecting a different date or barber.</Text>
          <Button 
            mode="contained" 
            onPress={() => {
              // Force refresh time slots with fallback
              const timeSlots = [...defaultTimeSlots];
              setAllTimeSlots(timeSlots);
              setAvailableTimes(timeSlots);
            }}
            style={styles.changeButton}
          >
            Force Show All Time Slots
          </Button>
          <Button 
            mode="contained" 
            onPress={() => setStep(3)}
            style={[styles.changeButton, { marginTop: 10 }]}
          >
            Select Different Date
          </Button>
        </View>
      ) : (
        <View style={styles.timeGrid}>
          {allTimeSlots.map(time => {
            const isAvailable = availableTimes.includes(time);
            
            return (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeCard,
                  isAvailable ? styles.availableTimeCard : styles.unavailableTimeCard,
                  selectedTime === time ? styles.selectedTimeCard : null
                ]}
                onPress={() => isAvailable && handleTimeSelect(time)}
                disabled={!isAvailable}
              >
                <Text 
                  style={[
                    styles.timeText,
                    isAvailable ? styles.availableTimeText : styles.unavailableTimeText,
                    selectedTime === time ? styles.selectedTimeText : null
                  ]}
                >
                  {time}
                </Text>
                <Text style={styles.endTimeText}>
                  {isAvailable ? `- ${getEndTime(time)}` : '(Booked)'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
  
  const renderBookingSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Booking Summary</Text>
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Salon:</Text>
            <Text style={styles.summaryValue}>{selectedSalon.name}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>{service.name}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Barber:</Text>
            <Text style={styles.summaryValue}>{selectedBarber.name}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>{format(new Date(selectedDate), 'MMMM d, yyyy')}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>{selectedTime} - {getEndTime(selectedTime)}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price:</Text>
            <Text style={styles.summaryValue}>${service.price}</Text>
          </View>
        </Card.Content>
      </Card>
      
      <Button 
        mode="contained" 
        style={[
          styles.bookButton, 
          { 
            backgroundColor: '#3F51B5', 
            height: 65, 
            margin: 20,
            borderRadius: 10,
            elevation: 10
          }
        ]}
        contentStyle={{ height: 65 }}
        loading={submitting}
        disabled={submitting}
        labelStyle={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}
        onPress={handleBooking}
      >
        CONFIRM APPOINTMENT
      </Button>
    </View>
  );
  
  if (loading && salons.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F4C75" />
        <Text style={{ marginTop: 10 }}>Loading salons...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Book Appointment</Text>
      </View>
      
      {/* Service Details */}
      <Card style={styles.serviceCard}>
        <Card.Content>
          <Title>{service.name}</Title>
          <View style={styles.serviceDetails}>
            <Paragraph style={styles.price}>${service.price}</Paragraph>
            <Paragraph style={styles.duration}>{service.duration} min</Paragraph>
          </View>
          <Paragraph>{service.description}</Paragraph>
        </Card.Content>
      </Card>
      
      {/* Booking progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressItem}>
          <View style={[styles.progressDot, step >= 1 ? styles.progressActive : null]}>
            <Text style={styles.progressNumber}>1</Text>
          </View>
          <Text style={styles.progressText}>Salon</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressItem}>
          <View style={[styles.progressDot, step >= 2 ? styles.progressActive : null]}>
            <Text style={styles.progressNumber}>2</Text>
          </View>
          <Text style={styles.progressText}>Barber</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressItem}>
          <View style={[styles.progressDot, step >= 3 ? styles.progressActive : null]}>
            <Text style={styles.progressNumber}>3</Text>
          </View>
          <Text style={styles.progressText}>Date</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressItem}>
          <View style={[styles.progressDot, step >= 4 ? styles.progressActive : null]}>
            <Text style={styles.progressNumber}>4</Text>
          </View>
          <Text style={styles.progressText}>Time</Text>
        </View>
      </View>
      
      {/* Current step content */}
      {step === 1 && renderSalonSelection()}
      {step === 2 && renderBarberSelection()}
      {step === 3 && renderDateSelection()}
      {step === 4 && renderTimeSelection()}
      
      {/* Booking Summary & Confirmation */}
      {selectedSalon && selectedBarber && selectedDate && selectedTime && renderBookingSummary()}
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
  serviceCard: {
    margin: 15,
    elevation: 2,
  },
  serviceDetails: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  price: {
    fontWeight: 'bold',
    marginRight: 15,
  },
  duration: {
    color: '#666',
  },
  // Progress indicator styles
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressActive: {
    backgroundColor: '#0F4C75',
  },
  progressNumber: {
    color: 'white',
    fontWeight: 'bold',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    padding: 15,
    marginBottom: 10,
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
    marginBottom: 15,
  },
  // Salon selection styles
  salonList: {
    marginTop: 10,
  },
  salonCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    alignItems: 'center',
  },
  selectedSalonCard: {
    backgroundColor: '#E1F5FE',
    borderWidth: 1,
    borderColor: '#0F4C75',
  },
  salonIcon: {
    marginRight: 10,
  },
  salonInfo: {
    flex: 1,
  },
  salonName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  salonAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  salonPhone: {
    fontSize: 12,
    color: '#666',
  },
  selectedIndicator: {
    marginLeft: 10,
  },
  selectedChip: {
    backgroundColor: '#0F4C75',
  },
  // Barber selection styles
  barberScroll: {
    marginTop: 10,
    paddingBottom: 5,
  },
  barberCard: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
    alignItems: 'center',
    elevation: 2,
  },
  selectedBarberCard: {
    backgroundColor: '#E1F5FE',
    borderWidth: 1,
    borderColor: '#0F4C75',
  },
  barberImage: {
    marginBottom: 10,
  },
  barberName: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  availabilityText: {
    fontSize: 10,
    color: '#666',
  },
  specialties: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  // Time selection styles
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timeCard: {
    width: '30%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  selectedTimeCard: {
    backgroundColor: '#0F4C75',
  },
  timeText: {
    color: '#333',
  },
  endTimeText: {
    color: '#666',
  },
  availableTimeCard: {
    backgroundColor: '#4CAF50',
  },
  unavailableTimeCard: {
    backgroundColor: '#F44336',
  },
  availableTimeText: {
    color: 'white',
  },
  unavailableTimeText: {
    color: 'white',
  },
  selectedTimeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noTimesText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  // Summary styles
  summaryCard: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontWeight: 'bold',
  },
  summaryValue: {
    textAlign: 'right',
  },
  divider: {
    backgroundColor: '#e0e0e0',
  },
  bookButton: {
    padding: 10,
    marginTop: 20,
    borderRadius: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#FFCCCC',
    borderWidth: 1,
    borderColor: '#FF0000',
    borderRadius: 5,
    marginBottom: 10,
  },
  errorText: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    marginBottom: 10,
  },
  changeButton: {
    padding: 10,
  },
  debugContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#E1F5FE',
    borderRadius: 5,
  },
  debugButton: {
    padding: 10,
  },
  weeklySchedule: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    padding: 5,
    marginTop: 10,
  },
  dayIndicator: {
    alignItems: 'center',
    padding: 2,
  },
  dayText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 3,
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  buttonContent: {
    height: 60,
    paddingVertical: 10,
  },
});

export default BookingScreen; 