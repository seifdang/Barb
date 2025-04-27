import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text, Card, Button, Searchbar, Chip, ActivityIndicator, Banner } from 'react-native-paper';
import { servicesApi } from '../../api/client';

// Sample services data for fallback if API fails
const sampleServices = [
  {
    _id: '1',
    name: 'Classic Haircut',
    description: 'Traditional haircut includes consultation, shampoo, condition, and style.',
    price: 25,
    duration: 30,
    image: 'https://images.unsplash.com/photo-1589710751893-f9aa8656451d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Nnx8aGFpcmN1dHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
    category: 'haircut'
  },
  {
    _id: '2',
    name: 'Beard Trim',
    description: 'Professional beard grooming and shaping with razor detailing.',
    price: 15,
    duration: 20,
    image: 'https://images.unsplash.com/photo-1621605810052-80936645a058?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8YmVhcmQlMjB0cmltfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
    category: 'beard'
  },
  {
    _id: '3',
    name: 'Premium Package',
    description: 'Haircut, beard trim, hot towel facial, and styling in one session.',
    price: 45,
    duration: 60,
    image: 'https://images.unsplash.com/photo-1564222256577-45e728f2c611?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fGJhcmJlcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
    category: 'combo'
  },
  {
    _id: '4',
    name: 'Kids Haircut',
    description: 'Gentle haircut service for children under 12 years old.',
    price: 20,
    duration: 25,
    image: 'https://images.unsplash.com/photo-1626143508000-4b31a27e9c7a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8a2lkcyUyMGhhaXJjdXR8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
    category: 'haircut'
  },
  {
    _id: '5',
    name: 'Hair Coloring',
    description: 'Professional hair coloring service with premium products.',
    price: 60,
    duration: 90,
    image: 'https://images.unsplash.com/photo-1619283651048-9ef01ec1da6e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MjB8fGhhaXIlMjBjb2xvcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
    category: 'coloring'
  },
  // New service: Protein Treatment
  {
    _id: '6',
    name: 'Protein Treatment',
    description: 'Deep protein treatment to strengthen and repair damaged hair.',
    price: 85,
    duration: 120, // 2 hours
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTJ8fGhhaXIlMjB0cmVhdG1lbnR8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
    category: 'treatment'
  },
  // New service: Brushing/Blowout
  {
    _id: '7',
    name: 'Brushing/Blowout',
    description: 'Professional blow dry and styling to achieve smooth, voluminous hair.',
    price: 35,
    duration: 30,
    image: 'https://images.unsplash.com/photo-1595922648424-6b3b0b81d044?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8aGFpciUyMGRyeWluZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
    category: 'styling'
  },
  // Combo: Haircut + Protein Treatment
  {
    _id: '8',
    name: 'Haircut & Protein Combo',
    description: 'Complete haircut with deep protein treatment for damaged hair. Full hair transformation.',
    price: 100,
    duration: 150, // 2.5 hours
    image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8aGFpciUyMHRyZWF0bWVudHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
    category: 'combo'
  },
  // Combo: Haircut + Brushing
  {
    _id: '9',
    name: 'Cut & Style Combo',
    description: 'Haircut followed by professional blow dry and styling for a complete new look.',
    price: 55,
    duration: 60,
    image: 'https://images.unsplash.com/photo-1519735777090-ec97162dc266?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8OHx8aGFpcmN1dCUyMGFuZCUyMHN0eWxlfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
    category: 'combo'
  }
];

// Updated categories to include new service types
const categories = [
  { id: 'all', name: 'All' },
  { id: 'haircut', name: 'Haircut' },
  { id: 'beard', name: 'Beard' },
  { id: 'treatment', name: 'Treatment' },
  { id: 'styling', name: 'Styling' },
  { id: 'combo', name: 'Combo' },
  { id: 'coloring', name: 'Coloring' }
];

const ServicesScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingSampleData, setUsingSampleData] = useState(false);
  
  useEffect(() => {
    fetchServices();
  }, []);
  
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingSampleData(false);
      
      const response = await servicesApi.getServices();
      
      if (response.data.services.length > 0) {
        setServices(response.data.services);
        setFilteredServices(response.data.services);
      } else {
        console.log('No services found, using sample data');
        setServices(sampleServices);
        setFilteredServices(sampleServices);
        setUsingSampleData(true);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services from server. Showing sample data instead.');
      // Use sample data if API fails
      setServices(sampleServices);
      setFilteredServices(sampleServices);
      setUsingSampleData(true);
    } finally {
      setLoading(false);
    }
  };
  
  const onChangeSearch = (query) => {
    setSearchQuery(query);
    filterServices(query, selectedCategory);
  };
  
  const selectCategory = (category) => {
    setSelectedCategory(category);
    filterServices(searchQuery, category);
  };
  
  const filterServices = (query, category) => {
    let filtered = services;
    
    // Filter by search query
    if (query) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(query.toLowerCase()) ||
        service.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter(service => service.category === category);
    }
    
    setFilteredServices(filtered);
  };
  
  const renderServiceItem = ({ item }) => (
    <Card style={styles.card} onPress={() => navigation.navigate('Booking', { service: item })}>
      <Card.Cover 
        source={{ uri: item.image || 'https://via.placeholder.com/300x150?text=No+Image' }} 
        style={styles.cardImage}
      />
      <Card.Content style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardDetails}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${item.price}</Text>
            <Text style={styles.duration}>{item.duration} min</Text>
          </View>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Booking', { service: item })}
            style={styles.bookButton}
          >
            Book
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F4C75" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Our Services</Text>
        <Text style={styles.headerSubtitle}>Choose from our premium services</Text>
      </View>
      
      <Searchbar
        placeholder="Search services"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={categories}
          renderItem={({ item }) => (
            <Chip
              selected={selectedCategory === item.id}
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.selectedCategoryChip
              ]}
              textStyle={[
                styles.categoryChipText,
                selectedCategory === item.id && styles.selectedCategoryChipText
              ]}
              onPress={() => selectCategory(item.id)}
            >
              {item.name}
            </Chip>
          )}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>
      
      {usingSampleData && (
        <Banner
          visible={true}
          icon="information"
          actions={[
            {
              label: 'Retry',
              onPress: fetchServices,
            },
          ]}
        >
          Showing demo services. Tap "Retry" to attempt loading from server.
        </Banner>
      )}
      
      {error && (
        <Banner
          visible={true}
          icon="alert"
          actions={[
            {
              label: 'Retry',
              onPress: fetchServices,
            },
          ]}
        >
          {error}
        </Banner>
      )}
      
      {filteredServices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No services match your search</Text>
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          renderItem={renderServiceItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.servicesList}
        />
      )}
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
  headerSubtitle: {
    fontSize: 16,
    color: '#BBE1FA',
    marginTop: 5,
  },
  searchBar: {
    margin: 15,
    borderRadius: 10,
    elevation: 2,
  },
  categoriesContainer: {
    marginBottom: 10,
  },
  categoriesList: {
    paddingHorizontal: 15,
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: 'white',
  },
  selectedCategoryChip: {
    backgroundColor: '#0F4C75',
  },
  categoryChipText: {
    color: '#666',
  },
  selectedCategoryChipText: {
    color: 'white',
  },
  servicesList: {
    padding: 15,
    paddingTop: 5,
  },
  card: {
    marginBottom: 15,
    borderRadius: 10,
    elevation: 3,
  },
  cardImage: {
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardDescription: {
    color: '#666',
    marginBottom: 10,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F4C75',
  },
  duration: {
    color: '#666',
    fontSize: 12,
  },
  bookButton: {
    borderRadius: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ServicesScreen; 