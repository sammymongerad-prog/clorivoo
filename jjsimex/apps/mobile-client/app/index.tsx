import { Redirect } from 'expo-router';

// Rediriger vers le splash screen au démarrage
export default function Index() {
  return <Redirect href="/splash" />;
}
