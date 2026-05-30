import React, { useEffect, Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#D14343', marginBottom: 12 }}>Erreur de rendu</Text>
          <Text style={{ fontSize: 13, color: '#333', fontFamily: 'monospace' }}>{String(this.state.error)}</Text>
          <Text style={{ fontSize: 11, color: '#999', marginTop: 8, fontFamily: 'monospace' }}>{this.state.error?.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

import { SessionProvider, useSession } from './src/hooks/useSession';
import { registerForPushNotifications } from './src/lib/notifications';
import { COLORS } from './src/lib/tokens';
import Icon from './src/components/Icon';

// Auth screens
import SplashScreen      from './src/screens/auth/SplashScreen';
import OnboardingScreen  from './src/screens/auth/OnboardingScreen';
import LoginScreen       from './src/screens/auth/LoginScreen';
import RegisterScreen    from './src/screens/auth/RegisterScreen';

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
import ManageVideosScreen    from './src/screens/seller/ManageVideosScreen';
import AdminConsoleScreen   from './src/screens/admin/AdminConsoleScreen';
import AddressScreen        from './src/screens/buyer/AddressScreen';
import SettingsScreen       from './src/screens/buyer/SettingsScreen';
import HelpScreen           from './src/screens/buyer/HelpScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function TabIcon({ name, focused }) {
  return (
    <Icon
      name={name}
      size={22}
      color={focused ? COLORS.primary : COLORS.mute}
      strokeWidth={focused ? 2 : 1.5}
    />
  );
}

function BuyerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { borderTopWidth: 1, borderTopColor: COLORS.hairline, height: 60, paddingBottom: 8, paddingTop: 4 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.mute,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home"       component={HomeScreen}     options={{ title: 'Accueil',    tabBarIcon: ({ focused }) => <TabIcon name="home"      focused={focused} /> }} />
      <Tab.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Catégories', tabBarIcon: ({ focused }) => <TabIcon name="grid"      focused={focused} /> }} />
      <Tab.Screen name="Cart"       component={CartScreen}     options={{ title: 'Panier',     tabBarIcon: ({ focused }) => <TabIcon name="shoppingBag" focused={focused} /> }} />
      <Tab.Screen name="Orders"     component={OrdersScreen}   options={{ title: 'Commandes',  tabBarIcon: ({ focused }) => <TabIcon name="package"   focused={focused} /> }} />
      <Tab.Screen name="Profile"    component={ProfileScreen}  options={{ title: 'Profil',     tabBarIcon: ({ focused }) => <TabIcon name="user"      focused={focused} /> }} />
    </Tab.Navigator>
  );
}


function AppNavigator() {
  const session = useSession();

  useEffect(() => {
    if (session?.user) {
      registerForPushNotifications(session.user.id).catch(console.warn);
    }
  }, [session?.user?.id]);

  // Un seul Stack avec tous les écrans — Splash toujours en premier
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Splash s'affiche toujours, puis redirige selon session */}
      <Stack.Screen name="Splash"           component={SplashScreen} />
      <Stack.Screen name="Onboarding"       component={OnboardingScreen} />
      <Stack.Screen name="Login"            component={LoginScreen} />
      <Stack.Screen name="Register"         component={RegisterScreen} />
      <Stack.Screen name="Tabs"             component={BuyerTabs} />
      <Stack.Screen name="Product"          component={ProductScreen} />
      <Stack.Screen name="Checkout"         component={CheckoutScreen} />
      <Stack.Screen name="Tracking"         component={TrackingScreen} />
      <Stack.Screen name="Messages"         component={MessagesScreen} />
      <Stack.Screen name="Chat"             component={ChatScreen} />
      <Stack.Screen name="Notifications"    component={NotificationsScreen} />
      <Stack.Screen name="Orders"           component={OrdersScreen} />
      <Stack.Screen name="Categories"       component={CategoriesScreen} />
      <Stack.Screen name="SellerDashboard"  component={SellerDashboardScreen} />
      <Stack.Screen name="AddProduct"       component={AddProductScreen} />
      <Stack.Screen name="SellerOrders"     component={SellerOrdersScreen} />
      <Stack.Screen name="ShopSetup"        component={ShopSetupScreen} />
      <Stack.Screen name="ManageVideos"     component={ManageVideosScreen} />
      <Stack.Screen name="AdminConsole"    component={AdminConsoleScreen} />
      <Stack.Screen name="Address"         component={AddressScreen} />
      <Stack.Screen name="Settings"        component={SettingsScreen} />
      <Stack.Screen name="Help"            component={HelpScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </SessionProvider>
    </ErrorBoundary>
  );
}
