FROM node:18-alpine

# Création du répertoire de travail
WORKDIR /usr/src/app

# Copie des fichiers package.json et package-lock.json
COPY package*.json ./

# Installation des dépendances
RUN npm install && npm install dotenv-cli

# Copie du reste du code source
COPY . .

# Définir la variable DOTENV_KEY pour le build
ARG DOTENV_KEY
ENV DOTENV_KEY=${DOTENV_KEY}

# Construction de l'application Next.js
RUN npx dotenv -e .env.vault -- npm run build

# Exposition du port utilisé par l'application
EXPOSE 8080

# Variables d'environnement
ENV PORT=8080
ENV NODE_ENV=production

# Commande pour démarrer l'application
CMD ["npm", "start"]