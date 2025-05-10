import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Route, Coordinates } from '../services/navigationService';
import { Ionicons } from '@expo/vector-icons';
import { navigationService } from '../services/navigationService';

interface RouteOptionsProps {
  routes: Route[];
  onPreviewRoute: (index: number) => void;
  onConfirmRoute: (index: number) => void;
  onClose?: () => void;
  selectedRouteIndex: number;
  originLocation?: {
    name: string;
    coordinates: Coordinates | [number, number];
  } | null;
  destinationLocation?: {
    name: string;
    coordinates: Coordinates | [number, number];
  } | null;
  routeType?: string;
  avoidTolls?: boolean;
}

/**
 * Formatte la durée en heures et minutes
 */
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} h ${minutes} min`;
  }
  return `${minutes} min`;
};

/**
 * Formatte la distance en km
 */
const formatDistance = (meters: number): string => {
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
};

/**
 * Caractéristiques de chaque type d'itinéraire
 */
const getRouteTypeInfo = (route: Route, index: number) => {
  // Détecter le type d'itinéraire en fonction de l'index (l'ordre dans lequel ils sont retournés par l'API)
  // L'API retourne dans cet ordre: fastest, shortest, eco, thrilling
  switch (index) {
    case 0: // Le plus rapide (fastest)
      return {
        type: 'Rapide',
        icon: 'speedometer-outline',
        description: 'Temps de trajet minimum',
        color: '#2196F3' // Bleu
      };
    case 1: // Le plus court (shortest)
      return {
        type: 'Court',
        icon: 'resize-outline',
        description: 'Distance minimale',
        color: '#FF9800' // Orange
      };
    case 2: // Économique (eco)
      return {
        type: 'Économique',
        icon: 'leaf-outline',
        description: 'Économie de carburant et péages',
        color: '#4CAF50' // Vert
      };
    case 3: // Pittoresque (thrilling)
      return {
        type: 'Pittoresque',
        icon: 'image-outline',
        description: 'Paysages et découverte',
        color: '#9C27B0' // Violet
      };
    default:
      return {
        type: 'Standard',
        icon: 'navigate-outline',
        description: 'Itinéraire recommandé',
        color: '#607D8B' // Bleu-gris
      };
  }
};

export const RouteOptions: React.FC<RouteOptionsProps> = ({ 
  routes, 
  onPreviewRoute,
  onConfirmRoute,
  onClose,
  selectedRouteIndex,
  originLocation,
  destinationLocation,
  routeType = 'fastest',
  avoidTolls = false
}) => {
  // Si selectedRouteIndex est -1, aucun itinéraire n'est sélectionné
  const [localSelectedIndex, setLocalSelectedIndex] = useState<number>(selectedRouteIndex >= 0 ? selectedRouteIndex : -1);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Mettre à jour la sélection locale et notifier le parent
  const handleRouteSelect = (index: number) => {
    setLocalSelectedIndex(index);
    onPreviewRoute(index);
  };
  
  // Ouvrir le modal pour sauvegarder l'itinéraire
  const openSaveModal = () => {
    if (localSelectedIndex < 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner un itinéraire à sauvegarder');
      return;
    }
    setSaveModalVisible(true);
    setRouteName('');
  };
  
  // Fermer le modal
  const closeSaveModal = () => {
    setSaveModalVisible(false);
  };
  
  // Sauvegarder l'itinéraire
  const saveRoute = async () => {
    if (!routeName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour l\'itinéraire');
      return;
    }
    
    if (!originLocation || !destinationLocation) {
      Alert.alert('Erreur', 'Informations d\'origine ou de destination manquantes');
      return;
    }
    
    const selectedRoute = routes[localSelectedIndex];
    
    setIsSaving(true);
    try {
      const response = await navigationService.saveRoute({
        name: routeName,
        originName: originLocation.name,
        destinationName: destinationLocation.name,
        originCoordinates: originLocation.coordinates,
        destinationCoordinates: destinationLocation.coordinates,
        distance: selectedRoute.distance,
        duration: selectedRoute.duration,
        avoidTolls,
        routeType
      });
      
      if (response.status === 'success') {
        Alert.alert('Succès', 'Itinéraire sauvegardé avec succès');
        closeSaveModal();
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving route:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  // Trouver l'itinéraire le plus rapide pour référence
  const fastestRoute = useMemo(() => {
    return routes.reduce((fastest, current) => 
      !fastest || (current.duration < fastest.duration) ? current : fastest, null as Route | null);
  }, [routes]);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choisir un itinéraire</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView style={styles.routeList}>
        {routes.map((route, index) => {
          const { type, icon, description, color } = getRouteTypeInfo(route, index);
          const isRecommended = fastestRoute === route;
          
          // Calculer différence par rapport au plus rapide
          let difference = '';
          if (fastestRoute && route !== fastestRoute) {
            const diffMinutes = Math.ceil((route.duration - fastestRoute.duration) / 60);
            difference = `+${diffMinutes} min`;
          }
          
          return (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.routeItem, 
                isRecommended && styles.recommendedRoute,
                localSelectedIndex === index && styles.selectedRoute
              ]}
              onPress={() => handleRouteSelect(index)}
            >
              <View style={[styles.routeTypeIndicator, { backgroundColor: color }]}>
                <Ionicons name={icon as any} size={20} color="white" />
              </View>
              
              <View style={styles.routeInfo}>
                <View style={styles.routeHeader}>
                  <Text style={styles.routeType}>{type}</Text>
                  {isRecommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Recommandé</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.routeDescription}>{description}</Text>
                
                <View style={styles.routeStats}>
                  <Text style={styles.duration}>
                    {formatDuration(route.duration)}
                    {difference ? <Text style={styles.difference}> ({difference})</Text> : null}
                  </Text>
                  <Text style={styles.distance}>{formatDistance(route.distance)}</Text>
                </View>
              </View>
              
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.saveButton, localSelectedIndex < 0 && styles.disabledButton]}
          onPress={openSaveModal}
          disabled={localSelectedIndex < 0}
        >
          <Ionicons name="bookmark-outline" size={18} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Sauvegarder</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.validateButton, localSelectedIndex < 0 && styles.disabledButton]}
          onPress={() => localSelectedIndex >= 0 && onConfirmRoute(localSelectedIndex)}
          disabled={localSelectedIndex < 0}
        >
          <Ionicons name="checkmark-outline" size={18} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Valider</Text>
        </TouchableOpacity>
      </View>
      
      {/* Modal pour sauvegarder l'itinéraire */}
      <Modal
        visible={saveModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeSaveModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeSaveModal}
        >
          <TouchableOpacity 
            style={styles.modalContent} 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sauvegarder l'itinéraire</Text>
              <TouchableOpacity onPress={closeSaveModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nom de l'itinéraire</Text>
              <TextInput
                style={styles.input}
                value={routeName}
                onChangeText={setRouteName}
                placeholder="Ex: Trajet domicile-travail"
                autoFocus
              />
            </View>
            
            <TouchableOpacity 
              style={styles.saveModalButton}
              onPress={saveRoute}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveModalButtonText}>Sauvegarder</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  routeList: {
    flex: 1,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  recommendedRoute: {
    backgroundColor: '#fffde7', // Fond jaune clair pour l'itinéraire recommandé
    borderColor: '#ffeb3b',
  },
  selectedRoute: {
    backgroundColor: '#e1f5fe',
    borderWidth: 2,
    borderColor: '#29b6f6',
  },
  routeTypeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  recommendedBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  routeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  routeStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  difference: {
    color: '#f44336',
    fontWeight: 'normal',
  },
  distance: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  validateButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  saveModalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
