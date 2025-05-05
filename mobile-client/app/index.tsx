import { Redirect } from 'expo-router';

export default function Index() {
  // Redirection automatique vers la page dashboard
  return <Redirect href="/(tabs)/dashboard" />;
}
