import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from './src/config/firebaseConfig'; 

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import SensorScreen from './src/screens/SensorScreen';
import AdminScreen from './src/screens/AdminScreen';

// Import managers and services
import StorageManager from './src/managers/StorageManager';
import AuthManager from './src/services/AuthManager';
import AdminManager from './src/services/AdminManager';
import SessionManager from './src/managers/SessionManager';
import { AdminProvider, useAdmin } from './src/contexts/AdminContext';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize managers
StorageManager.initialize(database);
AuthManager.initialize(auth, database);
AdminManager.initialize(database);

// Create stack navigator
const Stack = createNativeStackNavigator();

// AuthenticatedStack Component
const AuthenticatedStack = () => {
  const { isAdmin } = useAdmin();
  
  return (
    <Stack.Navigator 
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2C3E50',
        },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen 
        name="Sensors" 
        component={SensorScreen} 
        options={({ navigation }) => ({
          headerShown: true,
          headerRight: () => {
            if (isAdmin) {
              return (
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Admin')}
                  style={{ marginRight: 15 }}
                >
                  <Text style={{ color: '#fff' }}>Admin</Text>
                </TouchableOpacity>
              );
            } else {
              return null;
            }
          }
        })}
      />
      
      {isAdmin && (
        <Stack.Screen 
          name="Admin" 
          component={AdminScreen}
          options={{ headerShown: true }}
        />
      )}
    </Stack.Navigator>
  );
};

// Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if session is valid
    const checkSessionAndSetupAuth = async () => {
      try {
        const isSessionValid = await SessionManager.isSessionValid();
        console.log("Session valid:", isSessionValid);
        
        if (!isSessionValid) {
          console.log("No valid session, logging out");
          await AuthManager.logout();
        }
        
        setTimeout(() => {
          const handleAuthChange = (newUser) => {
            console.log("Auth state:", newUser ? "Logged in" : "Logged out");
            setUser(newUser);
            
            if (newUser) {
              SessionManager.startNewSession();
            }
          };
          
          AuthManager.subscribeToAuthChanges(handleAuthChange);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error("Setup error:", error);
        setIsLoading(false);
      }
    };
    
    checkSessionAndSetupAuth();
    
    return () => {
      AuthManager.unsubscribeFromAuthChanges(setUser);
    };
  }, []);

  // Show loading screen
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AdminProvider>
        {!user ? (
          <Stack.Navigator 
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2C3E50',
              },
              headerTintColor: '#fff',
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        ) : (
          <AuthenticatedStack />
        )}
      </AdminProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#2C3E50'
  },
  loadingText: {
    color: 'white', 
    fontSize: 18
  }
});