# Fase 1: compilar la web. Node solo hace falta aquí; no llega a la imagen final.
FROM node:24-alpine AS build
WORKDIR /app

# Dependencias antes que el código, para reutilizar esta capa entre builds.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# La API se sirve en el mismo origen, detrás de nginx (/api): ruta relativa.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
# "true" en la demo publicada: aviso de demo y cuentas de prueba en el login.
ARG VITE_DEMO_MODE=false
ENV VITE_DEMO_MODE=$VITE_DEMO_MODE
RUN npm run build

# Fase 2: solo nginx con los archivos compilados.
FROM nginx:1.30-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
