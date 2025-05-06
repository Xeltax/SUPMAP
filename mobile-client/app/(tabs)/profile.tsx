import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {user?.profilePicture ? (
            <Image 
              source={{ uri: user.profilePicture }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <FontAwesome name="user" size={50} color="#ffffff" />
            </View>
          )}
        </View>
        <Text style={styles.username}>{user?.username || 'Utilisateur'}</Text>
        <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres du compte</Text>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/profile/edit')}
        >
          <FontAwesome name="user-circle" size={24} color={Colors.light.tint} style={styles.menuIcon} />
          <Text style={styles.menuText}>Modifier le profil</Text>
          <FontAwesome name="chevron-right" size={16} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/profile/change-password')}
        >
          <FontAwesome name="lock" size={24} color={Colors.light.tint} style={styles.menuIcon} />
          <Text style={styles.menuText}>Changer le mot de passe</Text>
          <FontAwesome name="chevron-right" size={16} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="bell" size={24} color={Colors.light.tint} style={styles.menuIcon} />
          <Text style={styles.menuText}>Notifications</Text>
          <FontAwesome name="chevron-right" size={16} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="map-marker" size={24} color={Colors.light.tint} style={styles.menuIcon} />
          <Text style={styles.menuText}>Préférences de navigation</Text>
          <FontAwesome name="chevron-right" size={16} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="language" size={24} color={Colors.light.tint} style={styles.menuIcon} />
          <Text style={styles.menuText}>Langue</Text>
          <FontAwesome name="chevron-right" size={16} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="info-circle" size={24} color={Colors.light.tint} style={styles.menuIcon} />
          <Text style={styles.menuText}>À propos</Text>
          <FontAwesome name="chevron-right" size={16} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="question-circle" size={24} color={Colors.light.tint} style={styles.menuIcon} />
          <Text style={styles.menuText}>Aide</Text>
          <FontAwesome name="chevron-right" size={16} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
      >
        <FontAwesome name="sign-out" size={20} color="#fff" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    backgroundColor: Colors.light.tint,
    padding: 20,
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 30,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    marginRight: 15,
    width: 24,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
