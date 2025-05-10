import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Platform, SafeAreaView, Dimensions, TouchableOpacity, Text, KeyboardAvoidingView } from 'react-native';
import { RoutePlanner } from '../../components/RoutePlanner';
import { NavigationInstructions } from '../../components/NavigationInstructions';
import { RouteOptions } from '../../components/RouteOptions';
import { useNavigation as useExpoNavigation } from 'expo-router';
import { useNavigation } from '../../contexts/NavigationContext';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { Map } from '../../components/Map';
import { Ionicons } from '@expo/vector-icons';
import { IncidentForm } from '../../components/IncidentForm';
import { ToastProvider } from '../../components/Toast';
import { useLocalSearchParams } from 'expo-router';

export default function MapScreen() {
  const { 
    currentRoute, 
    availableRoutes,
    selectedRouteIndex,
    isNavigating, 
    routeOptions,
    previewRoute,
    confirmRoute,
    stopNavigation,
    currentStep,
    originLocation, 
    destinationLocation 
  } = useNavigation();
  const params = useLocalSearchParams();
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [minimizedNav, setMinimizedNav] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Used to force map re-render when route changes
  const [incidentFormVisible, setIncidentFormVisible] = useState(false);

  // Request location permissions
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission denied');
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      } catch (err) {
        console.error('Error getting location:', err);
      }
    })();
  }, []);

  // Force map re-render when route changes
  useEffect(() => {
    if (currentRoute) {
      setMapKey(prev => prev + 1);
    }
  }, [currentRoute]);

  // Vérifier s'il faut ouvrir la modale de signalement d'incident automatiquement
  useEffect(() => {
    if (params.showIncidentForm === 'true') {
      setIncidentFormVisible(true);
    }
  }, [params.showIncidentForm]);

  // Convert route data for the Map component
  // Coordonnées de l'itinéraire principal
  const routeCoordinates = useMemo(() => {
    if (!currentRoute || !currentRoute.legs) return [];
    
    return currentRoute.legs.flatMap(leg => 
      leg.points.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude
      }))
    );
  }, [currentRoute]);
  
  // Préparer les itinéraires alternatifs pour l'affichage
  const alternativeRoutes = useMemo(() => {
    if (!availableRoutes || availableRoutes.length <= 1) return [];
    
    return availableRoutes.map((route, index) => {
      // Extraire les coordonnées de l'itinéraire
      const coordinates = route.legs?.flatMap(leg => 
        leg.points.map(point => ({
          latitude: point.latitude,
          longitude: point.longitude
        }))
      ) || [];
      
      return {
        coordinates,
        selected: index === selectedRouteIndex
      };
    });
  }, [availableRoutes, selectedRouteIndex]);

  // Format origin and destination for the Map
  const origin = useMemo(() => {
    if (!originLocation) return null;
    return { 
      latitude: originLocation.coordinates[1], 
      longitude: originLocation.coordinates[0] 
    };
  }, [originLocation]);

  const destination = useMemo(() => {
    if (!destinationLocation) return null;
    return { 
      latitude: destinationLocation.coordinates[1], 
      longitude: destinationLocation.coordinates[0] 
    };
  }, [destinationLocation]);

  return (
    <ToastProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
        
        {/* Bouton pour signaler un incident */}
        {!isNavigating && !routeOptions && (
          <TouchableOpacity 
            style={styles.incidentButton}
            onPress={() => setIncidentFormVisible(true)}
          >
            <Ionicons name="warning" size={20} color="white" />
            <Text style={styles.incidentButtonText}>Signaler</Text>
          </TouchableOpacity>
        )}
        
        {/* Map Component */}
        <View style={styles.mapContainer}>
          <Map
            key={mapKey}
            origin={origin}
            destination={destination}
            routeCoordinates={routeCoordinates}
            alternativeRoutes={routeOptions ? alternativeRoutes : []}
            showUserLocation={true}
            followUserLocation={isNavigating}
            fitRouteToBounds={routeOptions}
            bottomPadding={routeOptions ? 180 : 0}
          />
        </View>
        
        {/* Navigation UI Overlay */}
        <View style={styles.overlayContainer}>
          {!isNavigating && !routeOptions && (
            <View style={styles.plannerContainer}>
              <RoutePlanner />
            </View>
          )}
          
          {routeOptions && (
            <View style={styles.routeOptionsContainer}>
              <RouteOptions 
                routes={availableRoutes} 
                selectedRouteIndex={selectedRouteIndex}
                onPreviewRoute={previewRoute}
                onConfirmRoute={confirmRoute}
                onClose={stopNavigation}
                originLocation={originLocation}
                destinationLocation={destinationLocation}
                routeType={'fastest'}
                avoidTolls={false}
              />
            </View>
          )}
          
          {isNavigating && !routeOptions && (
            <View style={[
              styles.instructionsContainer, 
              minimizedNav && styles.minimizedInstructions
            ]}>
              <NavigationInstructions 
                minimized={minimizedNav}
                onToggleMinimize={() => setMinimizedNav(!minimizedNav)}
              />
            </View>
          )}
          

        </View>
        
        {/* Formulaire de signalement d'incident */}
        <IncidentForm 
          visible={incidentFormVisible}
          onClose={() => setIncidentFormVisible(false)}
          coordinates={userLocation ? [userLocation.longitude, userLocation.latitude] : undefined}
          onSuccess={() => {
            setMapKey(parseInt(Date.now().toString()));
          }}
        />
      </SafeAreaView>
    </ToastProvider>
  );
}

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  incidentButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    backgroundColor: '#FF5722',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  incidentButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    position: 'absolute',
    width: '100%',
    ...Platform.select({
      ios: {
        bottom: 20,
      },
      android: {
        bottom: 0,
      },
      default: {
        bottom: 0,
      },
    }),
  },
  plannerContainer: {
    width: '100%',
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  routeOptionsContainer: {
    width: '100%',
    height: height * 0.5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  instructionsContainer: {
    width: '100%',
    maxHeight: '60%',
  },
  minimizedInstructions: {
    maxHeight: 60,
  },
});
