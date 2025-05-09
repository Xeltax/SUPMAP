import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  navigationService,
  RouteOptions,
  Route,
  RouteInstruction,
  Coordinates
} from '../services/navigationService';
import { useAuth } from './AuthContext';

interface NavigationContextType {
  isNavigating: boolean;
  currentRoute: Route | null;
  availableRoutes: Route[];
  selectedRouteIndex: number;
  currentStep: RouteInstruction | null;
  nextStep: RouteInstruction | null;
  stepIndex: number;
  totalSteps: number;
  progress: number;
  startNavigation: (options: RouteOptions) => Promise<void>;
  previewRoute: (routeIndex: number) => void;
  confirmRoute: (routeIndex: number) => void;
  stopNavigation: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  saveRoute: (name: string) => Promise<void>;
  originLocation: { name: string; coordinates: Coordinates } | null;
  destinationLocation: { name: string; coordinates: Coordinates } | null;
  setOriginLocation: (location: { name: string; coordinates: Coordinates } | null) => void;
  setDestinationLocation: (location: { name: string; coordinates: Coordinates } | null) => void;
  isLoading: boolean;
  routeOptions: boolean;
  error: string | null;
}

const defaultContext: NavigationContextType = {
  isNavigating: false,
  currentRoute: null,
  availableRoutes: [],
  selectedRouteIndex: 0,
  currentStep: null,
  nextStep: null,
  stepIndex: 0,
  totalSteps: 0,
  progress: 0,
  startNavigation: async () => {},
  previewRoute: () => {},
  confirmRoute: () => {},
  stopNavigation: () => {},
  goToNextStep: () => {},
  goToPreviousStep: () => {},
  saveRoute: async () => {},
  originLocation: null,
  destinationLocation: null,
  setOriginLocation: () => {},
  setDestinationLocation: () => {},
  isLoading: false,
  routeOptions: false, 
  error: null,
};

export const NavigationContext = createContext<NavigationContextType>(defaultContext);

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<RouteInstruction | null>(null);
  const [nextStep, setNextStep] = useState<RouteInstruction | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [progress, setProgress] = useState(0);
  const [originLocation, setOriginLocation] = useState<{ name: string; coordinates: Coordinates } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{ name: string; coordinates: Coordinates } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routeOptions, setRouteOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startNavigation = async (options: RouteOptions) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Demander différents types d'itinéraires
      const routeTypes = ['fastest', 'shortest', 'eco', 'thrilling'] as const;
      const routePromises = routeTypes.map(routeType => {
        const routeOptions = { ...options, routeType };
        return navigationService.calculateRoute(routeOptions);
      });
      
      const results = await Promise.all(routePromises);
      
      // Collecter tous les itinéraires valides
      const allRoutes: Route[] = [];
      
      results.forEach(response => {
        if (response.data?.routes && response.data.routes.length > 0) {
          allRoutes.push(response.data.routes[0]);
        }
      });
      
      if (allRoutes.length > 0) {
        // Stocker tous les itinéraires disponibles
        setAvailableRoutes(allRoutes);
        
        // Afficher l'écran de sélection d'itinéraire
        setRouteOptions(true);
        
        // Mettre à jour les routes mais ne rien sélectionner par défaut
        if (results.length > 0 && results[0].data?.routes && results[0].data.routes.length > 0) {
          // Stocker la référence au trajet le plus rapide mais ne pas le sélectionner
          const fastestRoute = results[0].data.routes[0];
          setCurrentRoute(fastestRoute); // Juste pour avoir les informations de base
          setSelectedRouteIndex(-1); // Aucun trajet sélectionné (-1 = aucune sélection)
        }
        if (currentRoute?.guidance && currentRoute.guidance.instructions.length > 0) {
          setCurrentStep(currentRoute.guidance.instructions[0]);
          setNextStep(currentRoute.guidance.instructions.length > 1 ? currentRoute.guidance.instructions[1] : null);
          setTotalSteps(currentRoute.guidance.instructions.length);
          setStepIndex(0);
        }
      } else {
        throw new Error("Aucun itinéraire trouvé");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du calcul de l'itinéraire");
      console.error("Navigation error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour prévisualiser un itinéraire sur la carte
  const previewRoute = (routeIndex: number) => {
    if (routeIndex >= 0 && routeIndex < availableRoutes.length) {
      setSelectedRouteIndex(routeIndex);
      // On met à jour la sélection mais on ne ferme pas l'écran d'options
      const route = availableRoutes[routeIndex];
      setCurrentRoute(route);
    }
  };
  
  // Fonction pour confirmer un itinéraire et démarrer la navigation
  const confirmRoute = (routeIndex: number) => {
    if (routeIndex >= 0 && routeIndex < availableRoutes.length) {
      const route = availableRoutes[routeIndex];
      setCurrentRoute(route);
      
      if (route.guidance && route.guidance.instructions.length > 0) {
        setCurrentStep(route.guidance.instructions[0]);
        setNextStep(route.guidance.instructions.length > 1 ? route.guidance.instructions[1] : null);
        setTotalSteps(route.guidance.instructions.length);
        setStepIndex(0);
      }
      
      // Fermer l'écran d'options d'itinéraires et commencer la navigation
      setRouteOptions(false);
      setIsNavigating(true);
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setRouteOptions(false);
    setCurrentRoute(null);
    setAvailableRoutes([]);
    setCurrentStep(null);
    setNextStep(null);
    setStepIndex(0);
    setTotalSteps(0);
    setProgress(0);
  };

  const goToNextStep = () => {
    if (!currentRoute?.guidance?.instructions || stepIndex >= totalSteps - 1) return;
    
    const newIndex = stepIndex + 1;
    setStepIndex(newIndex);
    setCurrentStep(currentRoute.guidance.instructions[newIndex]);
    setNextStep(newIndex < totalSteps - 1 ? currentRoute.guidance.instructions[newIndex + 1] : null);
    setProgress(newIndex / (totalSteps - 1));
  };

  const goToPreviousStep = () => {
    if (!currentRoute?.guidance?.instructions || stepIndex <= 0) return;
    
    const newIndex = stepIndex - 1;
    setStepIndex(newIndex);
    setCurrentStep(currentRoute.guidance.instructions[newIndex]);
    setNextStep(currentRoute.guidance.instructions[newIndex + 1]);
    setProgress(newIndex / (totalSteps - 1));
  };

  const saveRoute = async (name: string) => {
    if (!currentRoute || !originLocation || !destinationLocation) {
      setError("Informations d'itinéraire insuffisantes pour sauvegarder");
      return;
    }

    try {
      setIsLoading(true);
      await navigationService.saveRoute({
        name,
        originName: originLocation.name,
        destinationName: destinationLocation.name,
        originCoordinates: originLocation.coordinates,
        destinationCoordinates: destinationLocation.coordinates,
        routeData: currentRoute,
        geometry: currentRoute.legs.flatMap(leg => leg.points),
        distance: currentRoute.distance,
        duration: currentRoute.duration,
      });
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement de l'itinéraire");
      setIsLoading(false);
    }
  };

  const value = {
    isNavigating,
    currentRoute,
    availableRoutes,
    selectedRouteIndex,
    currentStep,
    nextStep,
    stepIndex,
    totalSteps,
    progress,
    startNavigation,
    previewRoute,
    confirmRoute,
    stopNavigation,
    goToNextStep,
    goToPreviousStep,
    saveRoute,
    originLocation,
    destinationLocation,
    setOriginLocation,
    setDestinationLocation,
    isLoading,
    routeOptions,
    error,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
