import { Stack } from 'expo-router';
// StatusBar est maintenant gérée globalement dans _layout.tsx
import { View } from 'react-native';
import Colors from '../../constants/Colors';

export default function AuthLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerShadowVisible: false,
          headerTintColor: Colors.light.tint,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: Colors.light.background,
          },
        }}
      >
        <Stack.Screen
          name="login"
          options={{
            title: 'Connexion',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            title: 'Inscription',
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
}
