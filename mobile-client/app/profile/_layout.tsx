import { Stack } from 'expo-router';
// StatusBar est maintenant gérée globalement dans _layout.tsx
import { View } from 'react-native';
import Colors from '../../constants/Colors';

export default function ProfileLayout() {
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
          // Garder le bouton de retour mais masquer le titre
          headerTitle: "",
        }}
      >
        <Stack.Screen
          name="edit"
          options={{
            title: 'Modifier le profil',
          }}
        />
        <Stack.Screen
          name="change-password"
          options={{
            title: 'Changer le mot de passe',
          }}
        />
      </Stack>
    </View>
  );
}
