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
  navigationMode?: 'overview' | 'navigation';
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
  navigationMode = 'overview',
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
        style={[
          styles.minimizedContainer, 
          navigationMode === 'navigation' && styles.navigationModeMinimized,
          navigationMode !== 'navigation' && styles.standardModeMinimized
        ]}
        onPress={onToggleMinimize}
      >
        <View style={styles.minimizedContent}>
          <Ionicons name={getInstructionIcon(currentStep)} size={24} color="#fff" />
          <View style={styles.minimizedTextContainer}>
            <ParsedInstruction 
              instruction={currentStep.text || "En cours de navigation..."} 
              textStyle={styles.minimizedText} 
              forceWhite={true}
            />
          </View>
          {distanceToNext && (
            <Text style={styles.minimizedDistance}>
              Dans {formatDistance(distanceToNext)}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={stopNavigation} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // Déterminer le style en fonction du mode de navigation
  const containerStyle = [
    styles.container,
    navigationMode === 'navigation' && styles.navigationModeContainer
  ];
  
  // Déterminer les couleurs en fonction du mode
  const textColor = navigationMode === 'navigation' ? '#fff' : '#333';
  const iconColor = navigationMode === 'navigation' ? '#fff' : '#2196F3';
  const secondaryTextColor = navigationMode === 'navigation' ? '#ddd' : '#777';

  return (
    <View style={containerStyle}>
      {/* Header with progress and close button */}
      <View style={[styles.header, navigationMode === 'navigation' && styles.navigationModeHeader]}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }, navigationMode === 'navigation' && styles.navigationModeProgressBar]} />
        </View>
        <Text style={[styles.stepCounter, { color: textColor }]}>
          Étape {stepIndex + 1}/{totalSteps}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={onToggleMinimize} style={styles.iconButton}>
            <Ionicons name="remove" size={24} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose || stopNavigation} style={styles.iconButton}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Current instruction */}
      <View style={[styles.currentStep, navigationMode === 'navigation' && styles.navigationModeCurrentStep]}>
        <View style={[styles.iconContainer, navigationMode === 'navigation' && styles.navigationModeIconContainer]}>
          <Ionicons name={getInstructionIcon(currentStep)} size={navigationMode === 'navigation' ? 50 : 40} color={iconColor} />
        </View>
        <View style={styles.instructionTextContainer}>
          <ParsedInstruction 
            instruction={currentStep.text || ""} 
            textStyle={[styles.instructionText, { color: textColor, fontSize: navigationMode === 'navigation' ? 22 : 18 }]} 
            forceWhite={navigationMode === 'navigation'}
          />
          {currentStep.street && (
            <Text style={[styles.streetName, { color: textColor }]}>{currentStep.street}</Text>
          )}
          {distanceToNext && (
            <Text style={[styles.distanceText, { color: textColor, fontSize: navigationMode === 'navigation' ? 20 : 16 }]} >
              Dans {formatDistance(distanceToNext)}
            </Text>
          )}
        </View>
      </View>
      
      {/* Next instruction preview */}
      {nextStep && (
        <View style={[styles.nextStep, navigationMode === 'navigation' && styles.navigationModeNextStep]}>
          <Text style={[styles.nextStepLabel, { color: textColor }]}>Ensuite</Text>
          <View style={styles.nextStepContent}>
            <Ionicons 
              name={getInstructionIcon(nextStep)} 
              size={24} 
              color={secondaryTextColor} 
              style={styles.nextStepIcon} 
            />
            <ParsedInstruction 
              instruction={nextStep.text || ""} 
              textStyle={[styles.nextStepText, { color: secondaryTextColor }]} 
              forceWhite={navigationMode === 'navigation'}
            />
          </View>
        </View>
      )}
      
      {/* Navigation summary */}
      <View style={[styles.summary, navigationMode === 'navigation' && styles.navigationModeSummary]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: textColor }]}>{formatDistance(remainingDistance)}</Text>
          <Text style={[styles.summaryLabel, { color: secondaryTextColor }]}>Restants</Text>
        </View>
        
        <View style={[styles.summaryDivider, navigationMode === 'navigation' && { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
        
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: textColor }]}>{formatTime(remainingTime)}</Text>
          <Text style={[styles.summaryLabel, { color: secondaryTextColor }]}>Temps estimé</Text>
        </View>
        
        <View style={[styles.summaryDivider, navigationMode === 'navigation' && { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
        
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: textColor }]} >
            {new Date(currentRoute?.arrivalTime || '').toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <Text style={[styles.summaryLabel, { color: secondaryTextColor }]}>Arrivée</Text>
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
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    paddingBottom: 20,
  },
  navigationModeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  header: {
    paddingTop: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  navigationModeHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 10,
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
    borderRadius: 2,
  },
  navigationModeProgressBar: {
    backgroundColor: '#4CAF50',
    height: 5,
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
    paddingHorizontal: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  navigationModeCurrentStep: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    paddingVertical: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  navigationModeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 20,
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
  navigationModeNextStep: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 15,
    borderRadius: 10,
    marginHorizontal: 10,
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
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navigationModeSummary: {
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 20,
    paddingBottom: 10,
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
  minimizedWrapper: {
    width: '100%',
  },
  minimizedContainer: {
    width: '100%',
    height: 60,
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  navigationModeMinimized: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  standardModeMinimized: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  minimizedInfoBar: {
    width: '100%',
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  minimizedInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  minimizedInfoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  minimizedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  minimizedTextContainer: {
    flex: 1,
    marginLeft: 10,
    overflow: 'hidden',
  },
  minimizedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  minimizedDistance: {
    color: '#fff',
    fontSize: 13,
    opacity: 0.9,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  closeButton: {
    padding: 4,
  },
});
