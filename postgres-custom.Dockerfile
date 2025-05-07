# Fichier: postgres-custom.Dockerfile
FROM postgis/postgis:14-3.2

COPY init-multiple-postgresql-databases.sh /tmp/
RUN tr -d '\r' < /tmp/init-multiple-postgresql-databases.sh > /docker-entrypoint-initdb.d/init-postgresql-databases.sh \
    && chmod +x /docker-entrypoint-initdb.d/init-postgresql-databases.sh