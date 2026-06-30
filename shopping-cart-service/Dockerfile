# Stage 1: Build Java backend using Gradle 8.7 & JDK 21
FROM gradle:8.7-jdk21-alpine AS builder
WORKDIR /app
COPY --chown=gradle:gradle . .
RUN gradle :shopping-cart-service:bootJar --no-daemon

# Stage 2: Final lightweight image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/shopping-cart-service/build/libs/shopping-cart-service.jar app.jar

# Expose microservice REST port
EXPOSE 8080

# Execute with Docker profile active to use PostgreSQL container link
ENTRYPOINT ["java", "-Dspring.profiles.active=docker", "-jar", "app.jar"]
