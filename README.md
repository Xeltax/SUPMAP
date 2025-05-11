# Supmap

Supmap est une application de navigation développée pour l'entreprise Trafine. Elle a pour but de permettre la visualisation et l'interaction avec une carte en temps réel pour créer des itinéraires et avertir d'incidents présents sur la route. L'application est développée en Node.js, Next.js, React et TypeScript. Elle utilise également l'API de TomTom pour la récupération des données historiques et en temps réel.

## Table des matières

- [Supmap](#supmap)
    - [Table des matières](#table-des-matières)
    - [Installation](#installation)
        - [Lancement avec Docker](#lancement-avec-docker)
            - [Pour Windows](#pour-windows)
            - [Pour Linux et macOS](#pour-linux-et-macos)
        - [Lancement sans Docker (mode développement)](#lancement-sans-docker-mode-développement)
    - [Configuration](#configuration)
    - [Lancer l'application](#lancer-lapplication)
        - [API Gateway](#api-gateway)
        - [Auth Service](#auth-service)
        - [Navigation Service](#navigation-service)
        - [Front-end](#front-end)
    - [Erreurs possibles](#erreurs-possibles)
    - [Architecture](#architecture)
        - [API Gateway](#api-gateway-1)
        - [Auth Service](#auth-service-1)
        - [Navigation Service](#navigation-service-1)
        - [Front-end](#front-end-1)
    - [Utilisation de l'application](#utilisation-de-lapplication)
        - [Utilisation de la carte](#utilisation-de-la-carte)
        - [Tableau de bord](#tableau-de-bord)
        - [Page d'itinéraire](#page-ditinéraire)
        - [Page de signalement](#page-de-signalement)

## Installation

### Lancement avec Docker

Le lancement avec docker est recommandé pour éviter les problèmes de dépendances et de configuration. Il est également plus rapide à mettre en place.

Le temps estimé pour le lancement de l'application est d'environ 3 minutes.

Une fois tout les conteneurs lancés, vous pourrez accéder à l'application à l'adresse suivante : [http://localhost:8080](http://localhost:8080)

#### Pour Windows

**Prérequis :** Docker Desktop

Cloner le projet dans un répertoire de votre choix :

```bash
git clone https://github.com/Xeltax/SUPMAP.git
```

Pour faciliter le déploiement, un fichier `docker-compose-all.bat` est présent à la racine du projet. Il suffit de le lancer pour compiler et lancer l'application.

#### Pour Linux et macOS

**Prérequis :** Docker

Cloner le projet dans un répertoire de votre choix :

```bash
git clone https://github.com/Xeltax/SUPMAP.git
cd SUPMAP
```

Pour lancer l'application, exécutez la commande suivante dans un terminal à la racine du projet :

```bash
docker-compose --env-file .env.global up -d
```

### Lancement sans Docker (mode développement)

**Prérequis :**
- Node.js >= 18
- npm >= 8
- MongoDB >= 5.0
- PostgreSQL >= 15.0 avec PostGIS

Cloner le projet dans un répertoire de votre choix :

```bash
git clone https://github.com/Xeltax/SUPMAP.git
cd SUPMAP
```

Installer les dépendances pour chaque microservice :

#### API Gateway
```bash
cd ./api-gateway/
npm install
```

#### Auth Service
```bash
cd ./auth-service/
npm install
```

#### Navigation Service
```bash
cd ./navigation-service/
npm install
```

#### Front-end
```bash
cd ./web-client/
npm install
```

## Configuration

Créez un fichier `.env` à la racine de chaque microservice en vous basant sur le fichier `.env.example`. Les clés d'API nécessaires seront celles de TomTom et de Google API que vous pouvez obtenir ici :
- [TomTom](https://developer.tomtom.com/)
- [Google API](https://console.cloud.google.com/apis/dashboard)

## Lancer l'application

### API Gateway
```bash
cd ./api-gateway/
npm run dev
```

### Auth Service
```bash
cd ./auth-service/
npm run dev
```

### Navigation Service
```bash
cd ./navigation-service/
npm run dev
```

### Front-end
```bash
cd ./web-client/
npm run dev
```

## Erreurs possibles

- Si vous avez une erreur de connexion à la base de données, vérifiez que MongoDB et PostgreSQL sont bien lancés et que les informations de connexion dans le fichier `.env` sont correctes.
- Si dans le Navigation Service votre connexion se fait mais qu'une erreur de type "geometry" apparaît, c'est que l'extension PostGIS n'est pas installée dans votre PostgreSQL. Vérifiez l'installation et si cela est fait, exécutez la requête suivante dans votre base de données Postgre :
  ```sql
  CREATE EXTENSION postgis;
  ```

## Client Mobile

Contrairement à l'application web, l'application mobile n'est pas conteneurisée dans le projet et nécessite une compilation locale. Cette partie vous guide à travers les étapes nécessaires pour exécuter l'application sur un appareil physique ou un émulateur.

### Prérequis
- Node.js et npm installés
- [Expo Go](https://expo.dev/client) installé sur votre appareil mobile
  - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)

### Installation
```bash
cd ./mobile-client/
npm install
```

### Lancement de l'application

#### Méthode standard
Pour lancer l'application avec la configuration par défaut :
```bash
npm start
```

#### Configuration réseau spécifique
Expo peut sélectionner par défaut le réseau "Default Switch" au lieu de votre réseau Wi-Fi actuel utilisé par votre ordinateur et votre appareil mobile/émulateur, ce qui peut empêcher votre appareil mobile de se connecter à l'application. Pour résoudre ce problème :

```bash
npm run start:ip
```

Cette commande vous permettra de sélectionner manuellement l'interface réseau appropriée, garantissant que votre appareil mobile et votre environnement de développement sont sur le même réseau.

#### Utilisation
Une fois l'application lancée :
1. Scannez le QR code affiché dans votre terminal avec l'application Expo Go
2. L'application se chargera automatiquement sur votre appareil

#### Dépannage
- Assurez-vous que votre appareil mobile et votre ordinateur sont connectés au même réseau Wi-Fi
- Si vous rencontrez des problèmes de connexion, essayez d'utiliser `npm run start:ip` et sélectionnez explicitement votre interface réseau

#### Ressources additionnelles
- [Documentation Expo](https://docs.expo.dev/)
- [Guide de démarrage Expo](https://docs.expo.dev/get-started/installation/)


## Architecture
Supmap est construit sur une architecture de microservices, permettant une meilleure séparation des préoccupations, une scalabilité accrue et une maintenance simplifiée. Voici les principaux composants de l'architecture :

### Microservices
1. **API Gateway** (Node.js + Express) :
    - Point d'entrée unique pour toutes les requêtes.
    - Gère le routage des requêtes vers les microservices appropriés
    - Implémente des fonctionnalités transversales comme l'authorization et la gestion des erreurs
2. **Auth Service** (Node.js) :
    - Gestion des utilisateurs et des autorisations
    - Authentification avec JWT (login, logout, refresh token)
    - Enregistrement des nouveaux utilisateurs
    - Gestion des rôles (utilisateur, administrateur)
    - Stocke les données utilisateurs dans MongoDB
3. **Navigation Service** (Node.js + PostgreSQL + PostGIS) :
    - Gestion des itinéraires et des incidents
    - Utilise l'API de TomTom pour la création d'itinéraires et la récupération des données en temps réel
    - Stocke les itinéraires et les incidents dans PostgreSQL avec PostGIS pour la gestion des données géographiques
4. **Front-end** (Next.js + React + TypeScript) :
    - Interface utilisateur pour interagir avec les services
    - Utilise l'API Gateway pour communiquer avec les microservices
    - Intégration de la carte TomTom pour la visualisation des itinéraires et des incidents
### Base de données
- **MongoDB** : Utilisé pour stocker les données utilisateurs et les informations d'authentification.
- **PostgreSQL avec PostGIS** : Stockage des données géospatiales (itinéraires, incidents, coordonnées)

### Services externes
- **TomTom API** : Utilisé pour la création d'itinéraires, la récupération des données de trafic et la géocodification.
- **Google API Oauth** : Utilisé pour l'authentification des utilisateurs via leur compte Google.

### Schéma d'architecture

Voici un schéma d'architecture de l'application :

![Architecture de Supmap](https://i.ibb.co/RG74F49h/Archi.png)

## API
Supmap expose plusieurs API RESTful via l'API Gateway. Voici les principales catégories d'endpoints :

- **Authentification** : `/api/auth/login`, `/api/auth/register`, etc.
- **Itinéraires** : `/api/navigation/routes`, etc.
- **Incidents** : `/api/navigation/incidents`, etc.

Exemple d'utilisation de l'API pour créer un utilisateur :

```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "email": "test@mail.com",
  "password": "password123",
```

## Utilisation de l'application

L'application est accessible à l'adresse suivante : [http://localhost:3001](http://localhost:3001)

Vous pouvez vous créer un compte à l'adresse suivante : [http://localhost:3001/register](http://localhost:3001/register)

Si vous préférez, vous pouvez vous connecter avec un compte préexistant. Voici quelques comptes de test :

Utilisateur :
- **Email :** utilisateur@trafine.fr
- **Mot de passe :** password123

Administrateur :
- **Email :** admin@trafine.fr
- **Mot de passe :** password123

Une fois connecté, vous pourrez accéder à la carte via la barre de navigation ou en vous rendant à l'adresse [http://localhost:3001/map](http://localhost:3001/map) et créer des itinéraires. Vous pourrez également signaler des incidents sur la route et visualiser les incidents signalés par d'autres utilisateurs ou récupérés grâce à l'API de TomTom.

### Utilisation de la carte

Pour créer un itinéraire, il vous suffit de cliquer sur le bouton en bas à gauche de la carte puis de sélectionner un point de départ et d'arrivée sur la carte ou bien d'utiliser la barre de recherche en haut. Une fois le tracé présent sur la carte, une plateforme s'ouvrira vous permettant de voir les informations de navigation et de recalculer l'itinéraire selon vos préférences. Vous pouvez sauvegarder l'itinéraire en cliquant sur le bouton "Sauvegarder" et en lui donnant un nom avec la possibilité de le mettre en favoris ou non.

Pour signaler un incident, il vous suffit de cliquer à n'importe quel endroit sur la carte sans être en mode itinéraire (signalé par le message demandant de sélectionner un point de départ ou d'arrivée). Une petite popup apparaîtra permettant de signaler un incident. Vous devrez choisir le type d'incident, la sévérité de celui-ci, une description, plus une estimation de la durée de l'incident. Une fois le signalement fait, vous pourrez le visualiser sur la carte.

Une contribution communautaire est également présente sur les incidents. Vous pourrez valider ou non les signalements d'autres utilisateurs simplement en cliquant sur les incidents.

### Tableau de bord

Le tableau de bord vous permet de visualiser les itinéraires récents que vous avez créés ainsi que les incidents signalés et vous redirige vers les pages de détails de chaque partie.

### Page d'itinéraire

La page d'itinéraire permet de répertorier tous les itinéraires que vous avez créés. Vous pouvez les trier par date d'utilisation, type, distance, durée ou par nom. Vous pouvez également les supprimer en cliquant sur le bouton correspondant ou bien générer un QR Code pour exporter l'itinéraire sur votre application mobile.

Vous pouvez également visualiser les itinéraires favoris en cliquant sur le bouton "Favoris" en haut à droite de la page. Vous avez aussi la possibilité de mettre ou enlever un itinéraire des favoris en cliquant sur l'étoile en bas à droite de l'itinéraire. Si vous cliquez sur "Voir sur la carte" ou directement sur l'itinéraire, vous serez redirigé vers la carte avec le tracé de l'itinéraire sélectionné.

### Page de signalement

La page de signalement vous permet de visualiser tous les incidents signalés par vous. Vous pouvez les trier par type, statut, date de signalement, sévérité ou par position. Vous avez la possibilité de voir votre signalement en cliquant sur l'œil à droite de chaque signalement.