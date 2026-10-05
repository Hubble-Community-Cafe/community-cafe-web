# Stage 1: build
# Build and runtime use the same Java LTS as pom.xml and CI (25), so tests run on the production JVM.
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B clean package -DskipTests

# Stage 2: run
# Alpine/musl JRE: much smaller attack surface than the Ubuntu-based tag (no perl etc.).
# The app is pure Java (no native libs, no AWT, JDK-bundled tzdata) so musl is safe here.
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Upgrade the base image's packages first so OS security fixes published after the
# eclipse-temurin tag was built (for example libpng, flagged by the Trivy image scan) land on
# every build rather than waiting for a new upstream tag. This only picks up fixes within the
# base image's Alpine release, not ones shipped in a newer Alpine release only.
# curl for the health check; run as a non-root user (busybox adduser/addgroup syntax)
RUN apk upgrade --no-cache \
    && apk add --no-cache curl \
    && addgroup -S appgroup && adduser -S -G appgroup appuser \
    && mkdir -p /data/media && chown appuser:appgroup /data/media

COPY --from=build /app/target/community-cafe-backend-*.jar app.jar

USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
