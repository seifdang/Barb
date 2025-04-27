import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Title, TextInput, ActivityIndicator, Divider } from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';

const SalonDetailsScreen = ({ route, navigation }) => {
  const { salonId } = route.params;
  const { userInfo } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salon, setSalon] = useState(null);
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    fetchSalonDetails();
  }, [salonId]);

  const fetchSalonDetails = async () => {
    try {
      setLoading(true);
      
      const response = await apiClient.get(`/admin/salons/${salonId}`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });
      
      if (response.data && response.data.success) {
        const salonData = response.data.salon;
        setSalon(salonData);
        setFormData({
          name: salonData.name || '',
          address: {
            street: salonData.address?.street || '',
            city: salonData.address?.city || '',
            state: salonData.address?.state || '',
            postalCode: salonData.address?.postalCode || ''
          },
          phone: salonData.phone || '',
          email: salonData.email || '',
          description: salonData.description || ''
        });
        
        console.log('Salon details loaded');
      } else {
        console.error('Failed to load salon details:', response.data);
        Alert.alert('Error', 'Failed to load salon details');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching salon details:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load salon details: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSave = async () => {
    // Validate form
    if (!formData.name || !formData.address.street || !formData.address.city || !formData.phone) {
      Alert.alert('Error', 'Please fill in all required fields (name, address, phone)');
      return;
    }
    
    try {
      setSaving(true);
      
      const response = await apiClient.put(`/admin/salons/${salonId}`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        }
      });
      
      if (response.data && response.data.success) {
        Alert.alert('Success', 'Salon updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        console.error('Failed to update salon:', response.data);
        Alert.alert('Error', response.data?.message || 'Failed to update salon');
      }
      
      setSaving(false);
    } catch (error) {
      console.error('Error updating salon:', error);
      setSaving(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update salon');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F4C75" />
        <Text style={{ marginTop: 20 }}>Loading salon details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Salon</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Salon Information</Title>
            
            <TextInput
              label="Salon Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Street Address *"
              value={formData.address.street}
              onChangeText={(text) => setFormData({
                ...formData, 
                address: {...formData.address, street: text}
              })}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="City *"
              value={formData.address.city}
              onChangeText={(text) => setFormData({
                ...formData, 
                address: {...formData.address, city: text}
              })}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="State/Region"
              value={formData.address.state}
              onChangeText={(text) => setFormData({
                ...formData, 
                address: {...formData.address, state: text}
              })}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Postal Code"
              value={formData.address.postalCode}
              onChangeText={(text) => setFormData({
                ...formData, 
                address: {...formData.address, postalCode: text}
              })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <TextInput
              label="Phone *"
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
            />
            
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
            
            <Text style={styles.note}>* Required fields</Text>
            
            <View style={styles.buttonContainer}>
              <Button 
                mode="outlined" 
                onPress={() => navigation.goBack()}
                style={styles.button}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                style={styles.button}
              >
                Save Changes
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    marginBottom: 20,
    elevation: 2,
  },
  title: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  note: {
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    width: '45%',
  }
});

export default SalonDetailsScreen; 