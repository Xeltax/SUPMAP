import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Platform, SafeAreaView, Dimensions, TouchableOpacity, Text, KeyboardAvoidingView, Animated } from 'react-native';
import { RoutePlanner } from '../../components/RoutePlanner';
import { NavigationInstructions } from '../../components/NavigationInstructions';
import { RouteOptions } from '../../components/RouteOptions';
import { useNavigation as useExpoNavigation } from 'expo-router';
import { useNavigation } from '../../contexts/NavigationContext';
import * as Location from 'expo-location';
import { Map } from '../../components/Map';
import { Ionicons } from '@expo/vector-icons';
import { IncidentForm } from '../../components/IncidentForm';
import { ToastProvider } from '../../components/Toast';
import { useLocalSearchParams } from 'expo-router';
import { LocationObject } from 'expo-location';

const formatDistance = (meters: number) => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    const km = (meters / 1000).toFixed(1);
    return `${km} km`;
  }
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}` : `${hours}h`;
  }
};

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
    nextStep,
    originLocation, 
    destinationLocation 
  } = useNavigation();
  const params = useLocalSearchParams();
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [userHeading, setUserHeading] = useState<number | null>(null);
  const [userSpeed, setUserSpeed] = useState<number | null>(null);
  const [minimizedNav, setMinimizedNav] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [incidentFormVisible, setIncidentFormVisible] = useState(false);
  const [navigationMode, setNavigationMode] = useState<'overview' | 'navigation'>('overview');
  const locationSubscription = useRef<any>(null);
  const mapZoomLevel = useRef<number>(15);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission denied');
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation
        });
        
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        setUserHeading(location.coords.heading || 0);
        setUserSpeed(location.coords.speed || 0);
        
        if (locationSubscription.current) {
          locationSubscription.current.remove();
        }
        
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 5,
            timeInterval: 1000,
          },
          (location: LocationObject) => {
            setUserLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            });
            setUserHeading(location.coords.heading || 0);
            setUserSpeed(location.coords.speed || 0);
            
            if (location.coords.speed !== null) {
              if (location.coords.speed < 5) {
                mapZoomLevel.current = 19.5;
              } else if (location.coords.speed < 14) {
                mapZoomLevel.current = 18.5;
              } else if (location.coords.speed < 25) {
                mapZoomLevel.current = 17.5;
              } else {
                mapZoomLevel.current = 16.5;
              }
            } else {
              mapZoomLevel.current = 18.5;
            }
          }
        );
      } catch (err) {
        console.error('Error getting location:', err);
      }
    })();
    
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (currentRoute) {
      setMapKey(prev => prev + 1);
      
      if (isNavigating && !routeOptions) {
        setNavigationMode('navigation');
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }).start();
      } else {
        setNavigationMode('overview');
        fadeAnim.setValue(0);
      }
    }
  }, [currentRoute, isNavigating, routeOptions]);

  useEffect(() => {
    if (params.showIncidentForm === 'true') {
      setIncidentFormVisible(true);
    }
  }, [params.showIncidentForm]);

  const routeCoordinates = useMemo(() => {
    if (!currentRoute || !currentRoute.legs) return [];
    
    return currentRoute.legs.flatMap(leg => 
      leg.points.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude
      }))
    );
  }, [currentRoute]);
  
  const alternativeRoutes = useMemo(() => {
    if (!availableRoutes || availableRoutes.length <= 1) return [];
    
    return availableRoutes.map((route, index) => {
      
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
            fitRouteToBounds={routeOptions || (isNavigating && navigationMode === 'overview')}
            bottomPadding={routeOptions ? 180 : 0}
            rotateWithHeading={isNavigating && navigationMode === 'navigation'}
            heading={userHeading || 0}
            zoomLevel={mapZoomLevel.current}
            navigationMode={navigationMode}
            nextManeuverCoordinates={nextStep && nextStep.point ? {
              latitude: nextStep.point.latitude,
              longitude: nextStep.point.longitude
            } : undefined}
          />
        </View>
        
        {/* Barre supérieure avec boutons et infos - toujours visible quand on navigue */}
        {isNavigating && (
          <View style={styles.topBar}>
            {/* Bouton pour basculer entre les modes de navigation */}
            <TouchableOpacity 
              style={styles.navigationModeButton}
              onPress={() => {
                const newMode = navigationMode === 'overview' ? 'navigation' : 'overview';
                setNavigationMode(newMode);
                
                if (newMode === 'navigation') {
                  Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true
                  }).start();
                } else {
                  Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                  }).start();
                }
              }}
            >
              <Ionicons 
                name={navigationMode === 'overview' ? "navigate" : "map"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
            
            {/* Affichage de la vitesse en mode navigation */}
            {navigationMode === 'navigation' && userSpeed !== null && (
              <View style={styles.speedometer}>
                <Text style={styles.speedValue}>
                  {Math.round(userSpeed * 3.6)} {/* Conversion m/s en km/h */}
                </Text>
                <Text style={styles.speedUnit}>km/h</Text>
              </View>
            )}
            
            {/* Informations de navigation résumées */}
            {navigationMode === 'navigation' && (
              <View style={styles.navigationSummaryBar}>
                <View style={styles.navigationSummaryItem}>
                  <Ionicons name="time-outline" size={16} color="white" />
                  <Text style={styles.navigationSummaryText}>
                    {formatTime(currentRoute?.duration ? Math.max(0, currentRoute.duration - (currentStep?.travelTimeInSeconds || 0)) : 0)}
                  </Text>
                </View>
                <View style={styles.navigationSummaryItem}>
                  <Ionicons name="navigate-outline" size={16} color="white" />
                  <Text style={styles.navigationSummaryText}>
                    {formatDistance(currentRoute?.distance ? currentRoute.distance - (currentStep?.routeOffsetInMeters || 0) : 0)}
                  </Text>
                </View>
                <View style={styles.navigationSummaryItem}>
                  <Ionicons name="flag-outline" size={16} color="white" />
                  <Text style={styles.navigationSummaryText}>
                    {currentRoute?.arrivalTime ? new Date(currentRoute.arrivalTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '--:--'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
        
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
              minimizedNav && styles.minimizedInstructions,
              navigationMode === 'navigation' && styles.navigationModeInstructions
            ]}>
              <NavigationInstructions 
                minimized={minimizedNav}
                onToggleMinimize={() => setMinimizedNav(!minimizedNav)}
                navigationMode={navigationMode}
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
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
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
  navigationModeInstructions: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  incidentButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 25,
    backgroundColor: '#ff5722',
    borderRadius: 30,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  incidentButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    zIndex: 999, // Valeur très élevée pour être au-dessus de tout
  },
  navigationModeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginRight: 10,
  },
  speedometer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  navigationSummaryBar: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 10,
  },
  navigationSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  navigationSummaryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  speedValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  speedUnit: {
    color: 'white',
    fontSize: 14,
  },
});
