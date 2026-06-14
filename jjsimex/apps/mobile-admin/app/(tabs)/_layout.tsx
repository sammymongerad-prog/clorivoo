import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import Svg, { Path, Line, Circle, Rect } from 'react-native-svg';

function IcoDashboard({ color }: { color: string }) {
  return <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="3" width="7" height="9" rx="1"/><Rect x="14" y="3" width="7" height="5" rx="1"/><Rect x="14" y="12" width="7" height="9" rx="1"/><Rect x="3" y="16" width="7" height="5" rx="1"/></Svg>;
}
function IcoPackage({ color }: { color: string }) {
  return <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><Path d="m3.27 6.96 8.73 5.05 8.73-5.05"/><Path d="M12 22.08V12"/></Svg>;
}
function IcoQr() {
  return <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="3" width="7" height="7" rx="1"/><Rect x="14" y="3" width="7" height="7" rx="1"/><Rect x="3" y="14" width="7" height="7" rx="1"/><Line x1="14" y1="14" x2="14" y2="17"/><Line x1="21" y1="14" x2="21" y2="17"/><Line x1="14" y1="21" x2="17" y2="21"/><Line x1="21" y1="18" x2="21" y2="21"/></Svg>;
}
function IcoUsers({ color }: { color: string }) {
  return <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><Circle cx="9" cy="7" r="4"/><Path d="M23 21v-2a4 4 0 0 0-3-3.87"/><Path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>;
}
function IcoSettings({ color }: { color: string }) {
  return <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></Svg>;
}

function ScannerIcon() {
  return (
    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 }}>
      <IcoQr />
    </View>
  );
}

export default function AdminTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#111111', borderTopColor: '#2A2A2A', borderTopWidth: 1, height: 70, paddingBottom: 10 },
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <IcoDashboard color={color} /> }} />
      <Tabs.Screen name="colis" options={{ title: 'Colis', tabBarIcon: ({ color }) => <IcoPackage color={color} /> }} />
      <Tabs.Screen name="scanner" options={{ title: '', tabBarIcon: () => <ScannerIcon />, tabBarLabel: () => null }} />
      <Tabs.Screen name="clients" options={{ title: 'Clients', tabBarIcon: ({ color }) => <IcoUsers color={color} /> }} />
      <Tabs.Screen name="gestion" options={{ title: 'Gestion', tabBarIcon: ({ color }) => <IcoSettings color={color} /> }} />
    </Tabs>
  );
}
