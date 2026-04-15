# Stage 1: Build the React app
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Override vite outDir since the default points to ../API/wwwroot
RUN npx vite build --outDir dist

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
