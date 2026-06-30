# Stage 1: Build Java backend using Gradle 8.7 & JDK 21
FROM gradle:8.7-jdk21-alpine AS builder
WORKDIR /app
COPY --chown=gradle:gradle . .
RUN gradle :catalog-service:bootJar --no-daemon

# Stage 2: Final lightweight image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/catalog-service/build/libs/catalog-service.jar app.jar

# Expose microservice REST port
EXPOSE 8081

# Execute with Docker profile active to use PostgreSQL container link
ENTRYPOINT ["java", "-Dspring.profiles.active=docker", "-jar", "app.jar"]
