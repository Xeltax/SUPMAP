import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Colors from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import api from '../../services/api';
import RoutesModal from '../../components/RoutesModal';
import IncidentsModal from '../../components/IncidentsModal';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [routesModalVisible, setRoutesModalVisible] = useState(false);
  const [incidentsModalVisible, setIncidentsModalVisible] = useState(false);
  const [stats, setStats] = useState({
    savedRoutes: 0,
    reportedIncidents: 0,
    activeIncidents: 0
  });

  interface Route {
    id: string;
    name: string;
    distance: number;
    duration: number;
    originName: string;
    destinationName: string;
  }
  
  const [recentRoutes, setRecentRoutes] = useState<Route[]>([]);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      
      const recentRoutesResponse = await api.routes.getUserRoutes({ limit: 3, sort: 'lastUsed' });
      
      const allRoutesResponse = await api.routes.getUserRoutes();
      
      const incidentsResponse = await api.traffic.getUserReports();
      
      if (recentRoutesResponse.status === 'success' && incidentsResponse.status === 'success' && allRoutesResponse.status === 'success') {
        const recentRoutes = recentRoutesResponse.data?.routes || [];
        const allRoutes = allRoutesResponse.data?.routes || [];
        const incidents = incidentsResponse.data?.incidents || [];
        
        setStats({
          savedRoutes: allRoutes.length,
          reportedIncidents: incidents.length,
          activeIncidents: 0
        });
        
        setRecentRoutes(recentRoutes);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const navigateToMap = () => {
    router.push('/(tabs)/map');
  };

  const navigateToRoutes = () => {
    setRoutesModalVisible(true);
  };

  const navigateToIncidents = () => {
    setIncidentsModalVisible(true);
    setIncidentsModalVisible(true);
  };
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData(true);
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.light.tint]}
          tintColor={Colors.light.tint}
        />
      }
    >
      {/* Welcome Card */}
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

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.statCard} onPress={navigateToRoutes}>
          <FontAwesome name="road" size={24} color={Colors.light.tint} />
          <Text style={styles.statValue}>{loading ? '-' : stats.savedRoutes}</Text>
          <Text style={styles.statLabel}>Itinéraires sauvegardés</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statCard} onPress={navigateToIncidents}>
          <FontAwesome name="exclamation-triangle" size={24} color={Colors.light.tint} />
          <Text style={styles.statValue}>{loading ? '-' : stats.reportedIncidents}</Text>
          <Text style={styles.statLabel}>Signalements créés</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Routes Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Itinéraires récents</Text>
          <TouchableOpacity onPress={navigateToRoutes}>
            <Text style={styles.seeAllText}>Voir tous</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
          </View>
        ) : recentRoutes.length > 0 ? (
          <View>
            {recentRoutes.map((route, index) => (
              <TouchableOpacity 
                key={route.id || index} 
                style={styles.routeItem}
                onPress={() => navigateToRoutes()}
              >
                <View style={styles.routeHeader}>
                  <Text style={styles.routeName}>{route.name || 'Itinéraire sans nom'}</Text>
                </View>
                <View style={styles.routeDetails}>
                  <View style={styles.routeMetrics}>
                    <FontAwesome name="road" size={14} color="#666" style={styles.routeIcon} />
                    <Text style={styles.routeMetricText}>
                      {Math.round(route.distance/1000)} km
                    </Text>
                    <Text style={styles.routeMetricText}>
                      {Math.floor(route.duration/60)} min
                    </Text>
                  </View>
                  <View style={styles.routeLocations}>
                    <Text style={styles.routeLocationText} numberOfLines={1}>
                      De: {route.originName || 'Départ'}
                    </Text>
                    <Text style={styles.routeLocationText} numberOfLines={1}>
                      À: {route.destinationName || 'Arrivée'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome name="map-o" size={50} color="#ccc" />
            <Text style={styles.emptyStateText}>Vous n'avez pas encore d'itinéraires sauvegardés</Text>
            <TouchableOpacity style={styles.createRouteButton} onPress={navigateToMap}>
              <FontAwesome name="map-marker" size={16} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Créer un itinéraire</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
        </View>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionButton} onPress={navigateToMap}>
            <FontAwesome name="map" size={24} color="#fff" style={styles.quickActionIcon} />
            <Text style={styles.quickActionText}>Explorer la carte</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={navigateToMap}>
            <FontAwesome name="road" size={24} color="#fff" style={styles.quickActionIcon} />
            <Text style={styles.quickActionText}>Nouvel itinéraire</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={navigateToIncidents}>
            <FontAwesome name="exclamation-triangle" size={24} color="#fff" style={styles.quickActionIcon} />
            <Text style={styles.quickActionText}>Signaler un incident</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Routes Modal */}
      <RoutesModal 
        visible={routesModalVisible} 
        onClose={() => setRoutesModalVisible(false)} 
      />
      
      {/* Incidents Modal */}
      <IncidentsModal 
        visible={incidentsModalVisible} 
        onClose={() => setIncidentsModalVisible(false)} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 20,
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
    marginHorizontal: 10,
    marginVertical: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#e6f2ff',
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
    marginTop: 15,
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
  seeAllText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  routeItem: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  routeHeader: {
    marginBottom: 8,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeLocationText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  createRouteButton: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
    paddingHorizontal: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: Colors.light.tint,
    width: '31%',
    height: 100,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
});
