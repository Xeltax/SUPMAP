FROM node:18-alpine

# Création du répertoire de travail
WORKDIR /usr/src/app

# Copie des fichiers package.json et package-lock.json
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du code source
COPY . .

# Exposition du port utilisé par l'application
EXPOSE 3000

# Commande pour démarrer l'application
CMD ["npm", "start"]