FROM node:18-alpine

# Création du répertoire de travail
WORKDIR /usr/src/app

# Copie des fichiers package.json et package-lock.json
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du code source
COPY . .

# Construction de l'application Next.js
RUN npm run build

# Exposition du port utilisé par l'application
EXPOSE 8080

# Variables d'environnement
ENV PORT=8080
ENV NODE_ENV=production

# Commande pour démarrer l'application
CMD ["npm", "start"]