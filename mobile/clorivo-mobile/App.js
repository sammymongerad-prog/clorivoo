import React, { useEffect, Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Capture global JS errors (module-level crashes not caught by React)
if (typeof window !== 'undefined') {
  window.__clorivoBundleReady = true;
  window.__CLORIVO_ERRORS__ = window.__CLORIVO_ERRORS__ || [];
  const _onerror = window.onerror;
  window.onerror = (msg, src, line, col, err) => {
    window.__CLORIVO_ERRORS__.push({ msg: String(msg), src, line, col, stack: err?.stack });
    if (_onerror) _onerror(msg, src, line, col, err);
  };
  const _onunhandled = window.onunhandledrejection;
  window.onunhandledrejection = (e) => {
    window.__CLORIVO_ERRORS__.push({ msg: String(e.reason), stack: e.reason?.stack });
    if (_onunhandled) _onunhandled(e);
  };
}

class ErrorBoundary extends Component {
  state = { error: null, globalErrors: [] };
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidMount() {
    this._interval = setInterval(() => {
      const ge = (typeof window !== 'undefined' && window.__CLORIVO_ERRORS__) ? [...window.__CLORIVO_ERRORS__] : [];
      if (ge.length > 0) this.setState({ globalErrors: ge });
    }, 500);
  }
  componentWillUnmount() { clearInterval(this._interval); }
  render() {
    const { error, globalErrors } = this.state;
    if (error || globalErrors.length > 0) {
      return (
        <ScrollView style={{ flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#D14343', marginBottom: 12 }}>🔴 Erreur détectée</Text>
          {error && <>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 4 }}>RENDER ERROR:</Text>
            <Text style={{ fontSize: 12, color: '#333', fontFamily: 'monospace', marginBottom: 4 }}>{String(error)}</Text>
            <Text style={{ fontSize: 10, color: '#999', fontFamily: 'monospace', marginBottom: 16 }}>{error?.stack}</Text>
          </>}
          {globalErrors.map((e, i) => (
            <View key={i} style={{ marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#D14343', paddingLeft: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 2 }}>JS ERROR {i + 1}:</Text>
              <Text style={{ fontSize: 12, color: '#333', fontFamily: 'monospace', marginBottom: 2 }}>{e.msg}</Text>
              {e.src ? <Text style={{ fontSize: 10, color: '#888', fontFamily: 'monospace' }}>{e.src}:{e.line}:{e.col}</Text> : null}
              {e.stack ? <Text style={{ fontSize: 10, color: '#999', fontFamily: 'monospace', marginTop: 2 }}>{e.stack}</Text> : null}
            </View>
          ))}
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
  useEffect(() => {
    // Hide the HTML loading indicator when React mounts
    if (typeof document !== 'undefined') {
      const el = document.getElementById('loading');
      if (el) el.style.display = 'none';
    }
  }, []);
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
