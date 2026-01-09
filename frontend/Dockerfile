# Build step
FROM node:20 AS build
WORKDIR /app

# Build arguments für Vite (werden zur Build-Zeit eingebaut)
ARG VITE_ENCRYPTION_KEY=""
ENV VITE_ENCRYPTION_KEY=$VITE_ENCRYPTION_KEY

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production server
FROM nginx:stable

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy and setup entrypoint script for runtime config
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
