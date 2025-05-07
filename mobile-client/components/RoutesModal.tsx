import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Modal, FlatList } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import api from '../services/api';
import { router } from 'expo-router';

// Définition du type Route
interface Route {
  id: string;
  name: string;
  distance: number;
  duration: number;
  originName: string;
  destinationName: string;
  favorite?: boolean;
}

interface RoutesModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function RoutesModal({ visible, onClose }: RoutesModalProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchRoutes();
    }
  }, [visible]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await api.routes.getUserRoutes({ sort: 'lastUsed' });
      
      if (response.status === 'success') {
        setRoutes(response.data?.routes || []);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoutes();
  };

  const navigateToRoute = (routeId: string) => {
    // Fermer la modal
    onClose();
    // Naviguer vers la page de détail de l'itinéraire (à implémenter plus tard)
    // Pour l'instant, rediriger vers la carte
    router.push('/(tabs)/map');
  };

  const renderRouteItem = ({ item }: { item: Route }) => (
    <TouchableOpacity 
      style={styles.routeItem}
      onPress={() => navigateToRoute(item.id)}
    >
      <View style={styles.routeHeader}>
        <Text style={styles.routeName}>{item.name || 'Itinéraire sans nom'}</Text>
        {item.favorite && (
          <FontAwesome name="star" size={16} color="#FFD700" />
        )}
      </View>
      <View style={styles.routeDetails}>
        <View style={styles.routeMetrics}>
          <FontAwesome name="road" size={14} color="#666" style={styles.routeIcon} />
          <Text style={styles.routeMetricText}>
            {Math.round(item.distance/1000)} km
          </Text>
          <Text style={styles.routeMetricText}>
            {Math.floor(item.duration/60)} min
          </Text>
        </View>
        <View style={styles.routeLocations}>
          <Text style={styles.routeLocationText} numberOfLines={1}>
            De: {item.originName || 'Départ'}
          </Text>
          <Text style={styles.routeLocationText} numberOfLines={1}>
            À: {item.destinationName || 'Arrivée'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Mes itinéraires</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name="times" size={20} color="#333" />
            </TouchableOpacity>
          </View>
          
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.light.tint} />
            </View>
          ) : routes.length > 0 ? (
            <FlatList
              data={routes}
              renderItem={renderRouteItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              onRefresh={onRefresh}
              refreshing={refreshing}
            />
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="map-o" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>Vous n'avez pas encore d'itinéraires sauvegardés</Text>
              <TouchableOpacity 
                style={styles.createRouteButton} 
                onPress={() => {
                  onClose();
                  router.push('/(tabs)/map');
                }}
              >
                <FontAwesome name="map-marker" size={16} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Créer un itinéraire</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  listContainer: {
    padding: 15,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  routeDetails: {
    marginTop: 5,
  },
  routeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeIcon: {
    marginRight: 5,
  },
  routeMetricText: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  routeLocations: {
    marginTop: 5,
  },
  routeLocationText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  createRouteButton: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
