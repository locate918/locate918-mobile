import React from 'react';
import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SavedEventsProvider } from './src/context/SavedEventsContext';
import { ActivityIndicator, View, Text } from 'react-native';

import LoginScreen from './src/screens/auth/LoginScreen';
import EventsScreen from './src/screens/tabs/EventsScreen';
import MapScreen from './src/screens/tabs/MapScreen';
import ChatScreen from './src/screens/tabs/ChatScreen';
import SavedScreen from './src/screens/tabs/SavedScreen';
import ProfileScreen from './src/screens/tabs/ProfileScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import PreferencesScreen from './src/screens/PreferencesScreen';
import AnalyticsConsentBanner from './src/components/AnalyticsConsentBanner';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🔍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>📍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Tully"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>✨</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>★</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return session ? <AppStack /> : <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <SavedEventsProvider>
        <View style={{ flex: 1 }}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <AnalyticsConsentBanner />
        </View>
      </SavedEventsProvider>
    </AuthProvider>
  );
}