import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextInput } from 'react-native';
import { navigationService, IncidentType, IncidentSeverity } from '../services/navigationService';
import { useNavigation } from '../contexts/NavigationContext';
import { useToast } from './Toast';

interface IncidentFormProps {
  visible: boolean;
  onClose: () => void;
  coordinates?: [number, number]; // [longitude, latitude]
  onSuccess?: () => void;
}

interface IncidentTypeOption {
  id: IncidentType;
  label: string;
  icon: string;
  color: string;
}

interface SeverityOption {
  id: IncidentSeverity;
  label: string;
  color: string;
}

const incidentTypes: IncidentTypeOption[] = [
  { id: 'accident', label: 'Accident', icon: 'car-sport', color: '#E53935' },
  { id: 'roadworks', label: 'Travaux', icon: 'construct', color: '#FB8C00' },
  { id: 'roadClosed', label: 'Route fermée', icon: 'close-circle', color: '#7B1FA2' },
  { id: 'congestion', label: 'Embouteillage', icon: 'car', color: '#FF9800' },
  { id: 'hazard', label: 'Obstacle', icon: 'warning', color: '#FFC107' },
  { id: 'police', label: 'Contrôle de police', icon: 'shield', color: '#1976D2' },
  { id: 'flood', label: 'Inondation', icon: 'water', color: '#00ACC1' },
  { id: 'other', label: 'Autre', icon: 'ellipsis-horizontal', color: '#607D8B' }
];

const severityOptions: SeverityOption[] = [
  { id: 'low', label: 'Faible', color: '#81C784' },
  { id: 'moderate', label: 'Moyenne', color: '#FFD54F' },
  { id: 'high', label: 'Élevée', color: '#FF8A65' },
  { id: 'severe', label: 'Sévère', color: '#E57373' }
];

const durationOptions = [
  { minutes: 30, label: '30 minutes' },
  { minutes: 60, label: '1 heure' },
  { minutes: 120, label: '2 heures' },
  { minutes: 240, label: '4 heures' },
  { minutes: 1440, label: '24 heures' }
];

export const IncidentForm: React.FC<IncidentFormProps> = ({
  visible,
  onClose,
  coordinates,
  onSuccess
}) => {
  const toast = useToast();
  const { originLocation } = useNavigation();
  
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [severity, setSeverity] = useState<IncidentSeverity>('moderate');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60); // 1 heure par défaut
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: type, 2: severity, 3: details

  // Toujours utiliser les coordonnées fournies (qui seront la position actuelle de l'utilisateur)
  const [incidentCoordinates, setIncidentCoordinates] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (coordinates) {
      setIncidentCoordinates(coordinates);
    }
  }, [coordinates]);

  const resetForm = () => {
    setIncidentType(null);
    setSeverity('moderate');
    setDescription('');
    setDuration(60);
    setStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const goToNextStep = () => {
    setStep(step + 1);
  };

  const goToPreviousStep = () => {
    setStep(step - 1);
  };

  const submitIncident = async () => {
    if (!incidentType || !incidentCoordinates) {
      toast.show({
        message: "Informations manquantes pour signaler l'incident",
        type: "error"
      });
      return;
    }

    setLoading(true);
    try {
      await navigationService.createTrafficIncident({
        incidentType,
        coordinates: incidentCoordinates,
        description,
        severity,
        durationMinutes: duration
      });

      toast.show({
        message: "Incident signalé avec succès",
        type: "success"
      });
      
      handleClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error reporting incident:', error);
      toast.show({
        message: "Erreur lors du signalement de l'incident",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderTypeSelector = () => (
    <ScrollView>
      <Text style={styles.sectionTitle}>Type d'incident</Text>
      <View style={styles.grid}>
        {incidentTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeItem,
              incidentType === type.id && styles.typeItemSelected,
              { borderColor: type.color }
            ]}
            onPress={() => setIncidentType(type.id)}
          >
            <Ionicons 
              name={type.icon as any} 
              size={32} 
              color={incidentType === type.id ? type.color : '#666'} 
            />
            <Text style={styles.typeLabel}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={handleClose}
        >
          <Text style={styles.buttonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.nextButton, !incidentType && styles.disabledButton]} 
          onPress={goToNextStep}
          disabled={!incidentType}
        >
          <Text style={styles.buttonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSeveritySelector = () => (
    <ScrollView>
      <Text style={styles.sectionTitle}>Sévérité</Text>
      <View style={styles.severityContainer}>
        {severityOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.severityItem,
              severity === option.id && styles.severityItemSelected,
              { backgroundColor: severity === option.id ? option.color : '#f1f1f1' }
            ]}
            onPress={() => setSeverity(option.id)}
          >
            <Text style={[
              styles.severityLabel,
              severity === option.id && styles.severityLabelSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Durée estimée</Text>
      <View style={styles.durationContainer}>
        {durationOptions.map((option) => (
          <TouchableOpacity
            key={option.minutes}
            style={[
              styles.durationItem,
              duration === option.minutes && styles.durationItemSelected
            ]}
            onPress={() => setDuration(option.minutes)}
          >
            <Text style={[
              styles.durationLabel,
              duration === option.minutes && styles.durationLabelSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.backButton]} 
          onPress={goToPreviousStep}
        >
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.nextButton]} 
          onPress={goToNextStep}
        >
          <Text style={styles.buttonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderDetailsForm = () => (
    <ScrollView>
      <Text style={styles.sectionTitle}>Description (optionnelle)</Text>
      <TextInput
        style={styles.descriptionInput}
        placeholder="Ajouter des détails sur l'incident..."
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
      />
      
      <View style={styles.locationInfo}>
        <Ionicons name="location" size={20} color="#666" />
        <Text style={styles.locationText}>
          {incidentCoordinates 
            ? `Votre position actuelle (Lat: ${incidentCoordinates[1].toFixed(5)}, Lng: ${incidentCoordinates[0].toFixed(5)})`
            : "En attente de votre position actuelle..."
          }
        </Text>
      </View>
      
      <Text style={styles.positionNote}>
        L'incident sera signalé à votre position actuelle.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.backButton]} 
          onPress={goToPreviousStep}
        >
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.submitButton, !incidentCoordinates && styles.disabledButton]} 
          onPress={submitIncident}
          disabled={loading || !incidentCoordinates}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Signaler</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Signaler un incident</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {step === 1 && renderTypeSelector()}
          {step === 2 && renderSeveritySelector()}
          {step === 3 && renderDetailsForm()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    padding: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  typeItem: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: '#f9f9f9'
  },
  typeItemSelected: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2
  },
  typeLabel: {
    marginTop: 8,
    color: '#333',
    textAlign: 'center'
  },
  severityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  severityItem: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center'
  },
  severityItemSelected: {
    borderWidth: 1,
    borderColor: '#333'
  },
  severityLabel: {
    color: '#333',
    fontWeight: '500'
  },
  severityLabelSelected: {
    color: '#fff',
    fontWeight: 'bold'
  },
  durationContainer: {
    marginBottom: 20
  },
  durationItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f1f1f1'
  },
  durationItemSelected: {
    backgroundColor: '#e1e1e1',
    borderWidth: 1,
    borderColor: '#ccc'
  },
  durationLabel: {
    color: '#333'
  },
  durationLabelSelected: {
    fontWeight: 'bold'
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20
  },
  locationText: {
    marginLeft: 8,
    color: '#666',
    flex: 1
  },
  positionNote: {
    fontStyle: 'italic',
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 15
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10
  },
  button: {
    flex: 1,
    borderRadius: 25,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5
  },
  cancelButton: {
    backgroundColor: '#e0e0e0'
  },
  backButton: {
    backgroundColor: '#e0e0e0'
  },
  nextButton: {
    backgroundColor: '#FF6F00'
  },
  submitButton: {
    backgroundColor: '#4CAF50'
  },
  disabledButton: {
    opacity: 0.5
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});
