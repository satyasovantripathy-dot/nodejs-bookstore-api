# syntax=docker/dockerfile:1

# Production container for the nodejs-bookstore-api Express service.
# The app connects to MongoDB (ATLAS_URI) on startup, then listens on PORT.
FROM node:20-alpine

WORKDIR /app

# Runtime defaults (override at deploy time via env / task definition)
ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Run as the built-in non-root 'node' user
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Temporary: run the no-DB stub server so the image deploys without MongoDB.
# Switch back to ["node", "src/server.js"] once ATLAS_URI/MongoDB is wired up.
CMD ["node", "src/sample-server.js"]
