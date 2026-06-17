# Stage 1: build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B clean package -DskipTests

# Stage 2: run
FROM eclipse-temurin:21-jre
WORKDIR /app

# curl for the health check; run as a non-root user
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* \
    && addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY --from=build /app/target/community-cafe-backend-*.jar app.jar

USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
