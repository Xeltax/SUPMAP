import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '../contexts/NavigationContext';
import { Ionicons } from '@expo/vector-icons';
import { RouteInstruction } from '../services/navigationService';
import { ParsedInstruction } from './ParsedInstruction';

interface NavigationInstructionsProps {
  onClose?: () => void;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

// Function to get appropriate icon based on maneuver type
const getInstructionIcon = (instruction: RouteInstruction | null) => {
  if (!instruction) return 'help-circle';
  
  const maneuver = instruction.maneuver.toLowerCase();
  
  if (maneuver.includes('arrive')) return 'flag';
  if (maneuver.includes('depart')) return 'flag-outline';
  if (maneuver.includes('roundabout')) return 'refresh';
  if (maneuver.includes('uturn')) return 'refresh';
  if (maneuver.includes('left')) return 'arrow-back';
  if (maneuver.includes('right')) return 'arrow-forward';
  if (maneuver.includes('straight') || maneuver.includes('continue')) return 'arrow-up';
  if (maneuver.includes('slight_left')) return 'arrow-up-circle';
  if (maneuver.includes('slight_right')) return 'arrow-up-circle';
  if (maneuver.includes('exit')) return 'exit-outline';
  if (maneuver.includes('keep_left')) return 'arrow-up-circle-outline';
  if (maneuver.includes('keep_right')) return 'arrow-up-circle-outline';
  
  return 'navigate';
};

// Function to format distance
const formatDistance = (meters: number) => {
  if (meters < 1000) {
    return `${meters} m`;
  } else {
    const km = (meters / 1000).toFixed(1);
    return `${km} km`;
  }
};

export const NavigationInstructions: React.FC<NavigationInstructionsProps> = ({
  onClose,
  minimized = false,
  onToggleMinimize,
}) => {
  const {
    isNavigating,
    currentStep,
    nextStep,
    stopNavigation,
    goToNextStep,
    goToPreviousStep,
    progress,
    stepIndex,
    totalSteps,
    currentRoute
  } = useNavigation();

  if (!isNavigating || !currentStep) {
    return null;
  }

  // Calculate remaining distance and time for the entire route
  const remainingDistance = currentRoute?.distance ? 
    currentRoute.distance - (currentStep.routeOffsetInMeters || 0) : 
    0;
  
  const remainingTime = currentRoute?.duration ? 
    Math.max(0, currentRoute.duration - (currentStep.travelTimeInSeconds || 0)) : 
    0;
  
  // Format time in minutes
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
    }
  };

  // Calculate distance to next step
  const distanceToNext = nextStep && currentStep ? 
    nextStep.routeOffsetInMeters - currentStep.routeOffsetInMeters : 
    null;

  if (minimized) {
    return (
      <TouchableOpacity
        style={styles.minimizedContainer}
        onPress={onToggleMinimize}
      >
        <View style={styles.minimizedContent}>
          <Ionicons name={getInstructionIcon(currentStep)} size={24} color="#fff" />
          <Text style={styles.minimizedText} numberOfLines={1}>
            {currentStep.text || "En cours de navigation..."}
          </Text>
        </View>
        <TouchableOpacity onPress={stopNavigation} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with progress and close button */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.stepCounter}>
          Étape {stepIndex + 1}/{totalSteps}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={onToggleMinimize} style={styles.iconButton}>
            <Ionicons name="remove" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose || stopNavigation} style={styles.iconButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Current instruction */}
      <View style={styles.currentStep}>
        <View style={styles.iconContainer}>
          <Ionicons name={getInstructionIcon(currentStep)} size={40} color="#2196F3" />
        </View>
        <View style={styles.instructionTextContainer}>
          <ParsedInstruction 
            instruction={currentStep.text || ""} 
            textStyle={styles.instructionText} 
          />
          {currentStep.street && (
            <Text style={styles.streetName}>{currentStep.street}</Text>
          )}
          {distanceToNext && (
            <Text style={styles.distanceText}>
              Dans {formatDistance(distanceToNext)}
            </Text>
          )}
        </View>
      </View>
      
      {/* Next instruction preview */}
      {nextStep && (
        <View style={styles.nextStep}>
          <Text style={styles.nextStepLabel}>Ensuite</Text>
          <View style={styles.nextStepContent}>
            <Ionicons 
              name={getInstructionIcon(nextStep)} 
              size={24} 
              color="#777" 
              style={styles.nextStepIcon} 
            />
            <ParsedInstruction 
              instruction={nextStep.text || ""} 
              textStyle={styles.nextStepText} 
            />
          </View>
        </View>
      )}
      
      {/* Navigation summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatDistance(remainingDistance)}</Text>
          <Text style={styles.summaryLabel}>Restants</Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatTime(remainingTime)}</Text>
          <Text style={styles.summaryLabel}>Temps estimé</Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {new Date(currentRoute?.arrivalTime || '').toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          <Text style={styles.summaryLabel}>Arrivée</Text>
        </View>
      </View>
      
      {/* Navigation controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, stepIndex === 0 && styles.controlButtonDisabled]} 
          onPress={goToPreviousStep}
          disabled={stepIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color={stepIndex === 0 ? "#ccc" : "#333"} />
          <Text style={[styles.controlText, stepIndex === 0 && styles.controlTextDisabled]}>
            Précédent
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.stopButton]} 
          onPress={stopNavigation}
        >
          <Ionicons name="stop-circle" size={24} color="#fff" />
          <Text style={[styles.controlText, styles.stopText]}>Arrêter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.controlButton, 
            stepIndex === totalSteps - 1 && styles.controlButtonDisabled
          ]} 
          onPress={goToNextStep}
          disabled={stepIndex === totalSteps - 1}
        >
          <Ionicons name="chevron-forward" size={24} color={stepIndex === totalSteps - 1 ? "#ccc" : "#333"} />
          <Text style={[
            styles.controlText, 
            stepIndex === totalSteps - 1 && styles.controlTextDisabled
          ]}>
            Suivant
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#f0f0f0',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2196F3',
  },
  stepCounter: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 6,
    marginLeft: 8,
  },
  currentStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  instructionTextContainer: {
    flex: 1,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  streetName: {
    fontSize: 16,
    color: '#444',
    marginBottom: 2,
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  nextStep: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  nextStepLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  nextStepContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextStepIcon: {
    marginRight: 12,
  },
  nextStepText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#777',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
  },
  controlButtonDisabled: {
    backgroundColor: '#f8f8f8',
  },
  stopButton: {
    backgroundColor: '#ff5252',
    marginHorizontal: 8,
  },
  controlText: {
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
  },
  controlTextDisabled: {
    color: '#aaa',
  },
  stopText: {
    color: '#fff',
  },
  minimizedContainer: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  minimizedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  minimizedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
});
