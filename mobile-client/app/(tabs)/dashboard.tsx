import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Colors from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const { user } = useAuth();
  
  const navigateToMap = () => {
    router.push('/(tabs)/map');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeTitle}>Bienvenue, {user?.username || 'utilisateur'} 👋</Text>
          <Text style={styles.welcomeSubtitle}>Voici le résumé de votre activité Trafine</Text>
        </View>
        <TouchableOpacity style={styles.mapButton} onPress={navigateToMap}>
          <FontAwesome name="map-marker" size={16} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Ouvrir la carte</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <FontAwesome name="road" size={24} color={Colors.light.tint} />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Trajets récents</Text>
        </View>
        
        <View style={styles.statCard}>
          <FontAwesome name="star" size={24} color={Colors.light.tint} />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Favoris</Text>
        </View>
        
        <View style={styles.statCard}>
          <FontAwesome name="warning" size={24} color={Colors.light.tint} />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Incidents signalés</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trajets récents</Text>
          <FontAwesome name="chevron-right" size={16} color="#ccc" />
        </View>
        <View style={styles.emptyState}>
          <FontAwesome name="map-o" size={50} color="#ccc" />
          <Text style={styles.emptyStateText}>Aucun trajet récent</Text>
          <Text style={styles.emptyStateSubtext}>Vos trajets récents apparaîtront ici</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Itinéraires favoris</Text>
          <FontAwesome name="chevron-right" size={16} color="#ccc" />
        </View>
        <View style={styles.emptyState}>
          <FontAwesome name="star-o" size={50} color="#ccc" />
          <Text style={styles.emptyStateText}>Aucun favori</Text>
          <Text style={styles.emptyStateSubtext}>Ajoutez des itinéraires à vos favoris pour les retrouver ici</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Incidents à proximité</Text>
          <FontAwesome name="chevron-right" size={16} color="#ccc" />
        </View>
        <View style={styles.emptyState}>
          <FontAwesome name="map-marker" size={50} color="#ccc" />
          <Text style={styles.emptyStateText}>Aucun incident à proximité</Text>
          <Text style={styles.emptyStateSubtext}>Les incidents à proximité apparaîtront ici</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  welcomeTextContainer: {
    marginBottom: 15,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  mapButton: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: -30,
    paddingHorizontal: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
});
