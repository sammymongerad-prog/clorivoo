import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Line, Polyline, Circle, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const ACCENT = '#F97316';

function IcoHome({ color }: { color: string }) {
  return <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Polyline points="9 22 9 12 15 12 15 22" /></Svg>;
}
function IcoPackage({ color }: { color: string }) {
  return <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><Path d="m3.27 6.96 8.73 5.05 8.73-5.05" /><Path d="M12 22.08V12" /></Svg>;
}
function IcoQr() {
  return <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="3" width="7" height="7" rx="1" /><Rect x="14" y="3" width="7" height="7" rx="1" /><Rect x="3" y="14" width="7" height="7" rx="1" /><Line x1="14" y1="14" x2="14" y2="17" /><Line x1="21" y1="14" x2="21" y2="17" /><Line x1="14" y1="21" x2="17" y2="21" /><Line x1="21" y1="18" x2="21" y2="21" /></Svg>;
}
function IcoBell({ color }: { color: string }) {
  return (
    <View>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><Path d="M13.73 21a2 2 0 0 1-3.46 0" /></Svg>
      <View style={s.badge}><Text style={s.badgeText}>3</Text></View>
    </View>
  );
}
function IcoUser({ color }: { color: string }) {
  return <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" /></Svg>;
}

function FloatingScanner() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/scanner')}
      style={s.scannerBtn}
      activeOpacity={0.85}
    >
      <IcoQr />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 20,
            left: 16,
            right: 82,
            height: 64,
            backgroundColor: 'rgba(20,20,20,0.92)',
            borderRadius: 99,
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            paddingBottom: 0,
            paddingTop: 0,
            paddingHorizontal: 8,
            elevation: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
          },
          tabBarActiveTintColor: ACCENT,
          tabBarInactiveTintColor: '#666666',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2, marginBottom: 8 },
          tabBarIconStyle: { marginTop: 8 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Accueil', tabBarIcon: ({ color }) => <IcoHome color={color} /> }}
        />
        <Tabs.Screen
          name="colis"
          options={{ title: 'Mes colis', tabBarIcon: ({ color }) => <IcoPackage color={color} /> }}
        />
        <Tabs.Screen
          name="scanner"
          options={{
            title: '',
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{ title: 'Notifs', tabBarIcon: ({ color }) => <IcoBell color={color} /> }}
        />
        <Tabs.Screen
          name="profil"
          options={{ title: 'Profil', tabBarIcon: ({ color }) => <IcoUser color={color} /> }}
        />
      </Tabs>

      {/* Floating scanner button — independent from capsule */}
      <FloatingScanner />
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: ACCENT,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  scannerBtn: {
    position: 'absolute',
    bottom: 22,
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 20,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.3)',
  },
});
