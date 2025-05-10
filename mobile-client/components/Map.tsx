import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

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
  bottomPadding?: number;
  children?: React.ReactNode;
  rotateWithHeading?: boolean;
  heading?: number;
  zoomLevel?: number;
  navigationMode?: 'overview' | 'navigation';
  nextManeuverCoordinates?: { latitude: number; longitude: number };
}

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05;
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
  rotateWithHeading = false,
  heading = 0,
  zoomLevel = 15,
  navigationMode = 'overview',
  nextManeuverCoordinates,
}) => {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

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

  const fitMapToRoute = () => {
    if (!mapRef.current) return;
    
    const points: { latitude: number; longitude: number }[] = [];
    
    if (origin) points.push(origin);
    
    if (destination) points.push(destination);
    
    if (waypoints && waypoints.length > 0) {
      points.push(...waypoints);
    }
    
    if (routeCoordinates && routeCoordinates.length > 0) {
      for (let i = 0; i < routeCoordinates.length; i += 10) {
        points.push(routeCoordinates[i]);
      }
    }
    
    if (alternativeRoutes && alternativeRoutes.length > 0) {
      alternativeRoutes.forEach(route => {
        if (route.coordinates && route.coordinates.length > 0) {
          points.push(route.coordinates[0]);
          points.push(route.coordinates[route.coordinates.length - 1]);
          
          const middle = Math.floor(route.coordinates.length / 2);
          points.push(route.coordinates[middle]);
        }
      });
    }
    
    if (points.length < 2) return;
    
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
    
    const PADDING = 1.5;
    const latDelta = (maxLat - minLat) * PADDING || 0.02;
    const lngDelta = (maxLng - minLng) * PADDING || 0.02;
    
    const screenHeight = height;
    const latitudeShift = bottomPadding > 0 ? (bottomPadding / screenHeight * latDelta / 2) : 0;
    
    mapRef.current.animateToRegion({
      latitude: (minLat + maxLat) / 2 + latitudeShift,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01)
    }, 500);
  };
  
  useEffect(() => {
    if (fitRouteToBounds) {
      fitMapToRoute();
    }
  }, [fitRouteToBounds, origin, destination, routeCoordinates, alternativeRoutes, waypoints]);

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

    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
      animated: true,
    });
  }, [origin, destination, waypoints, userLocation, showUserLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={[styles.map, { height: height + 50 }]}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: origin?.latitude || userLocation?.latitude || 48.866667,
          longitude: origin?.longitude || userLocation?.longitude || 2.333333,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation={showUserLocation}
        followsUserLocation={followUserLocation}
        onPress={(e) => onMapPress && onMapPress(e.nativeEvent.coordinate)}
        minZoomLevel={3} 
        maxZoomLevel={19} 
        rotateEnabled={true} 
        pitchEnabled={true} 
        toolbarEnabled={false} 
        zoomEnabled={true}
        zoomControlEnabled={false} 
        loadingEnabled={true}
        moveOnMarkerPress={true}
        camera={rotateWithHeading ? {
          center: userLocation || {
            latitude: origin?.latitude || 48.866667,
            longitude: origin?.longitude || 2.333333,
          },
          pitch: 75,
          heading: heading,
          altitude: 300,
          zoom: zoomLevel,
        } : undefined}
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
            opacity={navigationMode === 'navigation' ? 0.7 : 1}
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
            strokeWidth={navigationMode === 'navigation' ? 8 : 5}
            strokeColor="#2196F3"
            lineDashPattern={navigationMode === 'navigation' ? undefined : undefined}
          />
        )}
        
        {/* Next maneuver marker for navigation mode */}
        {navigationMode === 'navigation' && nextManeuverCoordinates && (
          <Marker
            coordinate={nextManeuverCoordinates}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.nextManeuverMarker}>
              <Ionicons name="arrow-forward-circle" size={30} color="#FF5722" />
            </View>
          </Marker>
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
    height: '115%',
    width: '115%',
    marginLeft: -5,
    marginRight: -5,
    marginBottom: -30,
  },
  alternativeRoute: {
    opacity: 0.6,
  },
  selectedRoute: {
    opacity: 1,
    zIndex: 2,
  },
  nextManeuverMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: '#FF5722',
  },
});
