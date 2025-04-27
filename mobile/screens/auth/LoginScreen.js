import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  ActivityIndicator,
  Snackbar
} from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [visible, setVisible] = useState(false);
  
  const { login, isLoading, userToken } = useContext(AuthContext);
  
  // Redirect to Home if already logged in
  useEffect(() => {
    if (userToken) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  }, [userToken, navigation]);
  
  const onDismissSnackBar = () => setVisible(false);
  
  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      setVisible(true);
      return;
    }
    
    try {
      const result = await login(email, password);
      
      if (!result.success) {
        setErrorMessage(result.message);
        setVisible(true);
      } else {
        console.log('Login successful, redirecting...');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setVisible(true);
    }
  };
  
  // Add test data login
  const handleTestLogin = async () => {
    setEmail('test@example.com');
    setPassword('password123');
    
    // Small delay for visual feedback
    setTimeout(async () => {
      const result = await login('test@example.com', 'password123');
      
      if (!result.success) {
        Alert.alert(
          'Demo Mode', 
          'Could not log in with test account. Creating a new account...',
          [{ text: 'OK' }]
        );
        
        // You could add code here to auto-register a test account
      }
    }, 300);
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>BarberBook</Text>
          <Text style={styles.subtitle}>Book your next haircut with ease</Text>
        </View>
        
        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="email-input"
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry
            testID="password-input"
          />
          
          <Button 
            mode="contained" 
            onPress={handleLogin}
            style={styles.button}
            loading={isLoading}
            disabled={isLoading}
            testID="login-button"
          >
            Login
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleTestLogin}
            style={styles.demoButton}
            disabled={isLoading}
          >
            Demo Login
          </Button>
          
          <View style={styles.registerContainer}>
            <Text>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Register here</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Snackbar
          visible={visible}
          onDismiss={onDismissSnackBar}
          duration={3000}
          style={styles.snackbar}
        >
          {errorMessage}
        </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#0F4C75',
  },
  subtitle: {
    fontSize: 16,
    color: '#3282B8',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  demoButton: {
    marginTop: 10,
    paddingVertical: 6,
    borderColor: '#3282B8',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#0F4C75',
    fontWeight: 'bold',
  },
  snackbar: {
    backgroundColor: '#d32f2f',
  },
});

export default LoginScreen; 