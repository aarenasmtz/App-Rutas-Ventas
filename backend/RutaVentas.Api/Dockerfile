# ==========================================
# 1. BUILD STAGE (.NET 9 SDK)
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copiar csproj y restaurar paquetes
COPY ["RutaVentas.Api.csproj", "./"]
RUN dotnet restore "RutaVentas.Api.csproj"

# Copiar el resto del código y compilar en Release
COPY . .
RUN dotnet publish "RutaVentas.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ==========================================
# 2. RUNTIME STAGE (.NET 9 ASPNET RUNTIME)
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "RutaVentas.Api.dll"]
