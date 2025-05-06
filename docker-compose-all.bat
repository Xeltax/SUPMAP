@echo off
echo Démarrage de tous les services avec dotenvVault...
docker-compose --env-file .env.global up -d
echo Services démarrés !