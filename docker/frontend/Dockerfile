FROM node:22-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install

ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=${VITE_API_URL}

COPY frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine

COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/client-vite/dist /usr/share/nginx/html

EXPOSE 80