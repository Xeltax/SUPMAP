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
    - [Utilisation de l'application](#utilisation-de-lapplication)
        - [Utilisation de la carte](#utilisation-de-la-carte)
        - [Tableau de bord](#tableau-de-bord)
        - [Page d'itinéraire](#page-ditinéraire)
        - [Page de signalement](#page-de-signalement)

## Installation

### Lancement avec Docker

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