import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '../contexts/NavigationContext';
import { Coordinates } from '../services/navigationService';
import { navigationService } from '../services/navigationService';

interface RoutePlannerProps {
  onRouteCalculated?: () => void;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({ onRouteCalculated }) => {
  const [originSearch, setOriginSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [originResults, setOriginResults] = useState<any[]>([]);
  const [destinationResults, setDestinationResults] = useState<any[]>([]);
  const [showOriginResults, setShowOriginResults] = useState(false);
  const [showDestinationResults, setShowDestinationResults] = useState(false);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const { 
    startNavigation,
    setOriginLocation,
    setDestinationLocation,
    originLocation,
    destinationLocation,
    isLoading
  } = useNavigation();
  
  // Demande des permissions et récupération de la position de l'utilisateur
  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès à la localisation est nécessaire pour utiliser cette fonctionnalité');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest
      });
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      // Récupérer le nom de l'adresse actuelle via geocoding inverse
      let locationName = 'Position actuelle';
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        if (reverseGeocode && reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const addressName = [
            address.street,
            address.city,
            address.region,
            address.postalCode
          ].filter(Boolean).join(', ');
          
          if (addressName) {
            locationName = addressName;
          }
          setOriginSearch(locationName);
        } else {
          setOriginSearch(locationName);
        }
      } catch (error) {
        console.error('Erreur de géocodage inverse:', error);
        setOriginSearch(locationName);
      }
      
      // Définir la position actuelle comme point de départ avec l'adresse réelle
      setOriginLocation({
        name: locationName,
        coordinates: [location.coords.longitude, location.coords.latitude]
      });
      
      setLocationLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error);
      Alert.alert('Erreur', 'Impossible de récupérer votre position actuelle');
      setLocationLoading(false);
    }
  };

  const searchLocations = async (query: string, isOrigin: boolean) => {
    if (query.trim().length < 3) {
      isOrigin ? setOriginResults([]) : setDestinationResults([]);
      return;
    }

    try {
      isOrigin ? setIsSearchingOrigin(true) : setIsSearchingDestination(true);
      
      const response = await navigationService.searchLocation(query);
      const locations = response?.data?.locations || [];
      
      if (isOrigin) {
        setOriginResults(locations);
        setShowOriginResults(true);
        setIsSearchingOrigin(false);
      } else {
        setDestinationResults(locations);
        setShowDestinationResults(true);
        setIsSearchingDestination(false);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      isOrigin ? setIsSearchingOrigin(false) : setIsSearchingDestination(false);
    }
  };

  const selectLocation = (location: any, isOrigin: boolean) => {
    if (isOrigin) {
      setOriginSearch(location.name);
      setOriginLocation({
        name: location.name,
        coordinates: [location.position.lon, location.position.lat]
      });
      setShowOriginResults(false);
    } else {
      setDestinationSearch(location.name);
      setDestinationLocation({
        name: location.name,
        coordinates: [location.position.lon, location.position.lat]
      });
      setShowDestinationResults(false);
    }
  };

  const handleSwapLocations = () => {
    if (originLocation && destinationLocation) {
      // Swap input values
      const tempSearch = originSearch;
      setOriginSearch(destinationSearch);
      setDestinationSearch(tempSearch);
      
      // Swap locations in context
      const tempLocation = originLocation;
      setOriginLocation(destinationLocation);
      setDestinationLocation(tempLocation);
    }
  };

  const calculateRoute = async () => {
    if (!originLocation || !destinationLocation) return;
    
    await startNavigation({
      origin: originLocation.coordinates,
      destination: destinationLocation.coordinates,
      routeType: 'fastest',
      traffic: true,
      instructionsType: 'tagged',
      language: 'fr-FR',
      instructionAnnouncementPoints: 'all',
    });
    
    if (onRouteCalculated) onRouteCalculated();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.inputsContainer}>
          {/* Origin Input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="radio-button-on" size={24} color="green" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Départ"
              value={originSearch}
              onChangeText={(text) => {
                setOriginSearch(text);
                searchLocations(text, true);
              }}
              onFocus={() => originResults.length > 0 && setShowOriginResults(true)}
            />
            {isSearchingOrigin && <ActivityIndicator size="small" color="#0000ff" />}
            
            {/* Bouton pour utiliser la position actuelle */}
            <TouchableOpacity 
              style={styles.locationButton} 
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#0000ff" />
              ) : (
                <MaterialIcons name="my-location" size={22} color="#555" />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Swap button */}
          <TouchableOpacity 
            style={styles.swapButton}
            onPress={handleSwapLocations}
            disabled={!originLocation || !destinationLocation}
          >
            <Ionicons name="swap-vertical" size={24} color={!originLocation || !destinationLocation ? "#ccc" : "#000"} />
          </TouchableOpacity>

          {/* Destination Input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="location" size={24} color="red" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Destination"
              value={destinationSearch}
              onChangeText={(text) => {
                setDestinationSearch(text);
                searchLocations(text, false);
              }}
              onFocus={() => destinationResults.length > 0 && setShowDestinationResults(true)}
            />
            {isSearchingDestination && <ActivityIndicator size="small" color="#0000ff" />}
          </View>
        </View>
        
        {/* Search Results for Origin */}
        {showOriginResults && originResults.length > 0 && (
          <View style={styles.resultsContainer}>
            {originResults.map((location, index) => (
              <TouchableOpacity
                key={`origin-${index}`}
                style={styles.resultItem}
                onPress={() => selectLocation(location, true)}
              >
                <Ionicons name="location-outline" size={20} color="#666" />
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultName}>{location.name}</Text>
                  <Text style={styles.resultAddress}>{location.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Search Results for Destination */}
        {showDestinationResults && destinationResults.length > 0 && (
          <View style={styles.resultsContainer}>
            {destinationResults.map((location, index) => (
              <TouchableOpacity
                key={`destination-${index}`}
                style={styles.resultItem}
                onPress={() => selectLocation(location, false)}
              >
                <Ionicons name="location-outline" size={20} color="#666" />
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultName}>{location.name}</Text>
                  <Text style={styles.resultAddress}>{location.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Calculate Route Button */}
      <TouchableOpacity
        style={[
          styles.button,
          (!originLocation || !destinationLocation || isLoading) ? styles.buttonDisabled : {}
        ]}
        onPress={calculateRoute}
        disabled={!originLocation || !destinationLocation || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="navigate" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Calculer l'itinéraire</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    margin: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  inputsContainer: {
    position: 'relative',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  locationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginLeft: 4,
  },
  swapButton: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -16,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 200,
    overflow: 'scroll',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#b0b0b0',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
