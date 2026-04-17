# Combined production Dockerfile (frontend + backend in one image)
# Build context: repository root
# Usage: docker build -t countmein .

# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY client-app/package.json client-app/package-lock.json ./
RUN npm ci
COPY client-app/ ./
# Override outDir to local dist (default targets ../API/wwwroot)
RUN npx vite build --outDir dist

# Stage 2: Build the .NET backend
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS backend-build
WORKDIR /app
COPY API/*.csproj ./
RUN dotnet restore
COPY API/ ./
# Copy frontend build output into wwwroot
COPY --from=frontend-build /app/dist ./wwwroot/
RUN dotnet publish -c Release -o out

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:7.0
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=backend-build /app/out .
ENTRYPOINT ["dotnet", "API.dll"]
