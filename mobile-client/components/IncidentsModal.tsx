import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Modal, FlatList } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import api from '../services/api';
import { router } from 'expo-router';

interface Incident {
  id: string;
  incidentType: string;
  description: string;
  severity: string;
  coordinates: [number, number];
  createdAt: string;
  active: boolean;
}

interface IncidentsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function IncidentsModal({ visible, onClose }: IncidentsModalProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchIncidents();
    }
  }, [visible]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await api.traffic.getUserReports();
      
      if (response.status === 'success') {
        setIncidents(response.data?.incidents || []);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchIncidents();
  };

  const navigateToIncident = (incidentId: string) => {
    onClose();
    router.push('/(tabs)/map');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIncidentIcon = (incidentType: string) => {
    switch (incidentType.toLowerCase()) {
      case 'accident':
        return 'car';
      case 'roadworks':
      case 'construction':
        return 'wrench';
      case 'congestion':
        return 'clock-o';
      case 'roadclosed':
        return 'road';
      case 'hazard':
        return 'warning';
      case 'flood':
        return 'tint';
      case 'police':
        return 'shield';
      default:
        return 'exclamation-circle';
    }
  };
  
  const getIncidentTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'accident':
        return 'Accident';
      case 'roadworks':
      case 'construction':
        return 'Travaux';
      case 'roadclosed':
        return 'Route fermée';
      case 'hazard':
        return 'Obstacle';
      case 'congestion':
        return 'Embouteillage';
      case 'flood':
        return 'Inondation';
      case 'police':
        return 'Contrôle de police';
      default:
        return 'Autre';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low':
        return '#2ECC40';
      case 'moderate':
      case 'medium':
        return '#FFDC00';   
      case 'high':
        return '#FF851B';
      case 'severe':
        return '#FF4136';
      default:
        return '#AAAAAA';
    }
  };
  
  const getSeverityLabel = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'Faible';
      case 'moderate':
      case 'medium':
        return 'Moyenne';
      case 'high':
        return 'Élevée';
      case 'severe':
        return 'Sévère';
      default:
        return 'Inconnue';
    }
  };

  const renderIncidentItem = ({ item }: { item: Incident }) => (
    <TouchableOpacity 
      style={styles.incidentItem}
      onPress={() => navigateToIncident(item.id)}
    >
      <View style={styles.incidentHeader}>
        <View style={styles.typeContainer}>
          <FontAwesome name={getIncidentIcon(item.incidentType)} size={16} color={Colors.light.tint} />
          <Text style={styles.incidentType}>
            {getIncidentTypeLabel(item.incidentType)}
          </Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>
            {getSeverityLabel(item.severity)}
          </Text>
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      
      <View style={styles.incidentFooter}>
        <Text style={styles.dateText}>
          Signalé le {formatDate(item.createdAt)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: item.active ? '#2ECC40' : '#AAAAAA' }]}>
          <Text style={styles.statusText}>
            {item.active ? 'Actif' : 'Résolu'}
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
      <TouchableOpacity 
        style={styles.centeredView} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalView} 
          activeOpacity={1}
          onPress={(e) => {
            e.stopPropagation();
          }}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Mes signalements</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name="times" size={20} color="#333" />
            </TouchableOpacity>
          </View>
          
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.light.tint} />
            </View>
          ) : incidents.length > 0 ? (
            <FlatList
              data={incidents}
              renderItem={renderIncidentItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              onRefresh={onRefresh}
              refreshing={refreshing}
            />
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome name="exclamation-triangle" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>Vous n'avez pas encore créé de signalements</Text>
              <TouchableOpacity 
                style={styles.createIncidentButton} 
                onPress={() => {
                  onClose();
                  router.push('/(tabs)/map');
                }}
              >
                <FontAwesome name="warning" size={16} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Signaler un incident</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
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
  incidentItem: {
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
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incidentType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#777',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
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
  createIncidentButton: {
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
