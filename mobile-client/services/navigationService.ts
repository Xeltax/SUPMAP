import api from './api';

export type Coordinates = [number, number]; // [longitude, latitude]

// Types pour les incidents
export type IncidentType = 'accident' | 'roadworks' | 'roadClosed' | 'congestion' | 'hazard' | 'police' | 'flood' | 'other';
export type IncidentSeverity = 'low' | 'moderate' | 'high' | 'severe';

export interface TrafficIncident {
  id?: string;
  userId?: string;
  incidentType: IncidentType;
  location: {
    type: string;
    coordinates: Coordinates;
  };
  description: string;
  severity: IncidentSeverity;
  validations?: number;
  invalidations?: number;
  active?: boolean;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RouteOptions {
  origin: Coordinates | string;
  destination: Coordinates | string;
  waypoints?: (Coordinates | string)[];
  routeType?: 'fastest' | 'shortest' | 'eco' | 'thrilling';
  avoidTolls?: boolean;
  traffic?: boolean;
  instructionsType?: 'coded' | 'text' | 'tagged';
  language?: string;
  sectionType?: 'lanes';
  instructionAnnouncementPoints?: 'none' | 'all';
  instructionPhonetics?: boolean;
  instructionRoadShieldReferences?: 'none' | 'all';
}

export interface RouteInstruction {
  routeOffsetInMeters: number;
  text: string;
  phoneticText?: string | null;
  maneuver: string;
  street: string;
  exitNumber?: string | null;
  roundaboutExitNumber?: number | null;
  travelTimeInSeconds?: number | null;
  point: {
    latitude: number;
    longitude: number;
  } | null;
  lanes?: any[] | null;
  laneSeparators?: any[] | null;
  roadShields?: any[] | null;
}

export interface RouteGuidance {
  instructions: RouteInstruction[];
  instructionGroups?: {
    firstInstructionIndex: number;
    lastInstructionIndex: number;
    groupMessage: string;
    groupPhoneticMessage?: string | null;
  }[];
}

export interface RouteLeg {
  points: {latitude: number; longitude: number}[];
  summary: {
    lengthInMeters: number;
    travelTimeInSeconds: number;
    trafficDelayInSeconds: number;
  };
}

export interface Route {
  distance: number;
  duration: number;
  trafficDelay: number;
  departureTime: string;
  arrivalTime: string;
  legs: RouteLeg[];
  guidance: RouteGuidance | null;
}

import { ApiResponse } from './api';

export interface RouteResponse extends ApiResponse<{routes: Route[]}> {}

/**
 * Service for navigation features
 */
class NavigationService {
  /**
   * Calculate a route between two points
   */
  async calculateRoute(options: RouteOptions): Promise<RouteResponse> {
    try {
      // Convertir les options dans le format attendu par l'API
      const routeData = {
        origin: options.origin,
        destination: options.destination,
        waypoints: options.waypoints,
        routeType: options.routeType || 'fastest',
        avoidTolls: options.avoidTolls || false,
        traffic: options.traffic !== undefined ? options.traffic : true
      };
      
      // L'API retourne déjà le bon format
      return await api.routes.calculate(routeData) as RouteResponse;
    } catch (error) {
      console.error('Error calculating route:', error);
      throw error;
    }
  }

  /**
   * Search for a location by name or address
   */
  async searchLocation(query: string, limit = 5, countrySet = 'FR') {
    try {
      // Utiliser la méthode search de l'API routes
      const response = await api.routes.search(query, { limit, countrySet });
      return response;
    } catch (error) {
      console.error('Error searching location:', error);
      throw error;
    }
  }

  /**
   * Save a route for later use
   */
  async saveRoute(routeData: {
    name: string;
    originName: string;
    destinationName: string;
    originCoordinates: Coordinates;
    destinationCoordinates: Coordinates;
    waypoints?: { name: string; coordinates: Coordinates }[];
    routeData: any;
    geometry: any;
    distance: number;
    duration: number;
    avoidTolls?: boolean;
    routeType?: string;
    isFavorite?: boolean;
  }) {
    try {
      // Méthode à implémenter si nécessaire, pour l'instant nous retournons un objet factice
      // Une fois le endpoint disponible dans l'API, cette méthode pourra être mise à jour
      return {
        status: 'success',
        data: {
          route: routeData
        }
      };
    } catch (error) {
      console.error('Error saving route:', error);
      throw error;
    }
  }

  /**
   * Get saved routes for the current user
   */
  async getUserRoutes() {
    try {
      // Utiliser l'API existante si disponible
      if (api.routes.getUserRoutes) {
        return await api.routes.getUserRoutes();
      }
      
      // Fallback si la méthode n'existe pas
      return { 
        status: 'success', 
        data: { routes: [] } 
      };
    } catch (error) {
      console.error('Error getting user routes:', error);
      throw error;
    }
  }

  /**
   * Get a specific route by ID
   */
  async getRouteById(routeId: string) {
    try {
      // Cette fonctionnalité n'est pas encore implémentée dans l'API
      // Retourner un objet factice pour l'instant
      return { 
        status: 'success', 
        data: { route: null } 
      };
    } catch (error) {
      console.error('Error getting route by ID:', error);
      throw error;
    }
  }
  
  /**
   * Récupérer tous les incidents de trafic actifs
   */
  async getTrafficIncidents(boundingBox?: string, incidentType?: string) {
    try {
      return await api.traffic.getTrafficIncidents(boundingBox || '', incidentType);
    } catch (error) {
      console.error('Error getting traffic incidents:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir les incidents signalés par l'utilisateur
   */
  async getUserIncidents() {
    try {
      return await api.traffic.getUserReports();
    } catch (error) {
      console.error('Error getting user incidents:', error);
      throw error;
    }
  }
  
  /**
   * Créer un nouvel incident de trafic
   */
  async createTrafficIncident(incident: {
    incidentType: IncidentType;
    coordinates: Coordinates;
    description?: string;
    severity?: IncidentSeverity;
    durationMinutes?: number;
  }) {
    try {
      return await api.traffic.reportTrafficIncident({
        incidentType: incident.incidentType,
        coordinates: incident.coordinates,
        description: incident.description,
        severity: incident.severity,
        durationMinutes: incident.durationMinutes || 60 // Par défaut 1 heure
      });
    } catch (error) {
      console.error('Error creating traffic incident:', error);
      throw error;
    }
  }
}

export const navigationService = new NavigationService();
