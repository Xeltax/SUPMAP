import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';
import { Coordinates } from '../services/navigationService';
import * as Location from 'expo-location';

interface MapProps {
  origin?: { latitude: number; longitude: number } | null;
  destination?: { latitude: number; longitude: number } | null;
  waypoints?: { latitude: number; longitude: number }[];
  routeCoordinates?: { latitude: number; longitude: number }[];
  alternativeRoutes?: { coordinates: { latitude: number; longitude: number }[]; selected?: boolean }[];
  onMapPress?: (coordinates: { latitude: number; longitude: number }) => void;
  followUserLocation?: boolean;
  showUserLocation?: boolean;
  fitRouteToBounds?: boolean;
  bottomPadding?: number; // Padding en bas de la carte
  children?: React.ReactNode;
}

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05; // Zoom initial modéré
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export const Map: React.FC<MapProps> = ({
  origin,
  destination,
  waypoints = [],
  routeCoordinates = [],
  alternativeRoutes = [],
  onMapPress,
  followUserLocation = false,
  showUserLocation = true,
  fitRouteToBounds = false,
  bottomPadding = 0,
  children,
}) => {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Request location permissions and get user location
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

  // Fonction pour ajuster la carte pour montrer tout l'itinéraire
  const fitMapToRoute = () => {
    if (!mapRef.current) return;
    
    // Collecter tous les points à inclure dans les limites
    const points: { latitude: number; longitude: number }[] = [];
    
    // Ajouter le point de départ s'il existe
    if (origin) points.push(origin);
    
    // Ajouter la destination si elle existe
    if (destination) points.push(destination);
    
    // Ajouter les waypoints
    if (waypoints && waypoints.length > 0) {
      points.push(...waypoints);
    }
    
    // Si on a un itinéraire principal, ajouter ses points (ou un échantillon)
    if (routeCoordinates && routeCoordinates.length > 0) {
      // Pour éviter de surcharger avec trop de points, on peut ajouter un échantillon
      // Ajouter points tous les 10 points pour garder la forme générale
      for (let i = 0; i < routeCoordinates.length; i += 10) {
        points.push(routeCoordinates[i]);
      }
    }
    
    // Si des itinéraires alternatifs sont disponibles, ajouter leurs points extrêmes
    if (alternativeRoutes && alternativeRoutes.length > 0) {
      alternativeRoutes.forEach(route => {
        if (route.coordinates && route.coordinates.length > 0) {
          // Ajouter le premier et dernier point de chaque itinéraire alternatif
          points.push(route.coordinates[0]);
          points.push(route.coordinates[route.coordinates.length - 1]);
          
          // Ajouter quelques points au milieu pour capturer les détours importants
          const middle = Math.floor(route.coordinates.length / 2);
          points.push(route.coordinates[middle]);
        }
      });
    }
    
    // S'assurer qu'on a au moins 2 points pour calculer une région
    if (points.length < 2) return;
    
    // Trouver les limites (min/max de latitude et longitude)
    let minLat = points[0].latitude;
    let maxLat = points[0].latitude;
    let minLng = points[0].longitude;
    let maxLng = points[0].longitude;
    
    points.forEach(point => {
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
      minLng = Math.min(minLng, point.longitude);
      maxLng = Math.max(maxLng, point.longitude);
    });
    
    // Calculer le delta avec une marge
    const PADDING = 1.5; // 50% de marge autour des points extrêmes
    const latDelta = (maxLat - minLat) * PADDING || 0.02;
    const lngDelta = (maxLng - minLng) * PADDING || 0.02;
    
    // Décaler le centre vers le haut pour compenser le padding en bas
    // On calcule la déviation nécessaire pour ajuster visuellement le centre
    const screenHeight = height; // height from Dimensions
    const latitudeShift = bottomPadding > 0 ? (bottomPadding / screenHeight * latDelta / 2) : 0;
    
    // Animer la carte vers cette région en décalant le centre vers le haut
    mapRef.current.animateToRegion({
      latitude: (minLat + maxLat) / 2 + latitudeShift, // Décaler vers le haut
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01), // Au moins un petit delta pour éviter le zoom excessif
      longitudeDelta: Math.max(lngDelta, 0.01)
    }, 500);
  };
  
  // Ajuster la carte pour montrer la route complète quand demandé
  useEffect(() => {
    if (fitRouteToBounds) {
      fitMapToRoute();
    }
  }, [fitRouteToBounds, origin, destination, routeCoordinates, alternativeRoutes, waypoints]);

  // Fit map to show all relevant points
  useEffect(() => {
    if (!mapRef.current) return;

    const points = [
      ...(origin ? [origin] : []),
      ...(destination ? [destination] : []),
      ...waypoints,
      ...(userLocation && showUserLocation ? [userLocation] : []),
    ];

    if (points.length === 0) return;

    if (points.length === 1) {
      mapRef.current.animateToRegion({
        latitude: points[0].latitude,
        longitude: points[0].longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
      return;
    }

    // Function to fit all markers on screen
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
      animated: true,
    });
  }, [origin, destination, waypoints, userLocation, showUserLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: origin?.latitude || userLocation?.latitude || 48.866667, // Default to Paris
          longitude: origin?.longitude || userLocation?.longitude || 2.333333,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation={showUserLocation}
        followsUserLocation={followUserLocation}
        onPress={(e) => onMapPress && onMapPress(e.nativeEvent.coordinate)}
        minZoomLevel={3} // Permettre un dézoom important
        maxZoomLevel={19} // Zoom maximal
        rotateEnabled={true} // Permettre la rotation pour une meilleure navigation
        pitchEnabled={true} // Permettre l'inclinaison pour une expérience 3D
        toolbarEnabled={false}
        zoomEnabled={true}
        zoomControlEnabled={true} // Activer les contrôles de zoom
        loadingEnabled={true}
        moveOnMarkerPress={true} // Déplacement sur le marqueur quand on clique dessus
      >
        {/* OpenStreetMap tiles */}
        <UrlTile 
          urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />

        {origin && (
          <Marker
            coordinate={origin}
            title="Départ"
            pinColor="green"
          />
        )}

        {destination && (
          <Marker
            coordinate={destination}
            title="Destination"
            pinColor="red"
          />
        )}

        {waypoints.map((waypoint, index) => (
          <Marker
            key={`waypoint-${index}`}
            coordinate={waypoint}
            title={`Étape ${index + 1}`}
            pinColor="blue"
          />
        ))}

        {/* Itinéraires alternatifs */}
        {alternativeRoutes.map((route, index) => (
          <Polyline
            key={`alt-route-${index}`}
            coordinates={route.coordinates}
            strokeWidth={4}
            strokeColor={route.selected ? "#2196F3" : "#9E9E9E"} 
            strokeColors={route.selected ? undefined : ["#9E9E9E"]}
            lineDashPattern={route.selected ? undefined : [1, 3]}
            tappable={true}
            zIndex={route.selected ? 3 : 1}
            lineCap="round"
          />
        ))}
        
        {/* Itinéraire principal */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={5}
            strokeColor="#2196F3"
            zIndex={2}
          />
        )}
      </MapView>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    // Légèrement surdimensionner la carte pour masquer le logo tout en permettant le dézoom
    height: '105%',
    width: '105%',
    marginLeft: -10,
    marginBottom: -10,
  },
});
