import { redirect } from 'next/navigation';

// Rediriger vers le dashboard par défaut
export default function HomePage() {
  redirect('/dashboard');
}
