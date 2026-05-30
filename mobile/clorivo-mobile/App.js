import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { SessionProvider, useSession } from './src/hooks/useSession';
import { registerForPushNotifications } from './src/lib/notifications';
import { COLORS } from './src/lib/tokens';

// Auth screens
import LoginScreen    from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Buyer screens
import HomeScreen          from './src/screens/buyer/HomeScreen';
import ProductScreen       from './src/screens/buyer/ProductScreen';
import CartScreen          from './src/screens/buyer/CartScreen';
import CheckoutScreen      from './src/screens/buyer/CheckoutScreen';
import TrackingScreen      from './src/screens/buyer/TrackingScreen';
import MessagesScreen      from './src/screens/buyer/MessagesScreen';
import ChatScreen          from './src/screens/buyer/ChatScreen';
import ProfileScreen       from './src/screens/buyer/ProfileScreen';
import OrdersScreen        from './src/screens/buyer/OrdersScreen';
import CategoriesScreen    from './src/screens/buyer/CategoriesScreen';

// Notifications
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';

// Seller screens
import SellerDashboardScreen from './src/screens/seller/SellerDashboardScreen';
import AddProductScreen      from './src/screens/seller/AddProductScreen';
import SellerOrdersScreen    from './src/screens/seller/SellerOrdersScreen';
import ShopSetupScreen       from './src/screens/seller/ShopSetupScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', opacity: focused ? 1 : 0.5 }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
    </View>
  );
}

function BuyerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { borderTopWidth: 1, borderTopColor: '#F0EDE8', height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.mute,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Panier', tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" focused={focused} /> }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages', tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const session = useSession();

  useEffect(() => {
    if (session?.user) {
      registerForPushNotifications(session.user.id).catch(console.warn);
    }
  }, [session?.user?.id]);

  if (session === undefined) return null; // loading

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session === null ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <>
          <Stack.Screen name="Tabs"             component={BuyerTabs} />
          <Stack.Screen name="Product"          component={ProductScreen} />
          <Stack.Screen name="Checkout"         component={CheckoutScreen} />
          <Stack.Screen name="Tracking"         component={TrackingScreen} />
          <Stack.Screen name="Chat"             component={ChatScreen} />
          <Stack.Screen name="Notifications"    component={NotificationsScreen} />
          <Stack.Screen name="Orders"           component={OrdersScreen} />
          <Stack.Screen name="Categories"       component={CategoriesScreen} />
          <Stack.Screen name="SellerDashboard"  component={SellerDashboardScreen} />
          <Stack.Screen name="AddProduct"       component={AddProductScreen} />
          <Stack.Screen name="SellerOrders"     component={SellerOrdersScreen} />
          <Stack.Screen name="ShopSetup"        component={ShopSetupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </SessionProvider>
  );
}
