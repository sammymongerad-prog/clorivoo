import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>JJ's IMEX</Text>
      <Text style={styles.subtitle}>L'app fonctionne !</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#F97316', fontSize: 36, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { color: '#FFFFFF', fontSize: 18 },
});
