package com.abysalto.cart.exception;

import com.abysalto.cart.service.MetricsTracker;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final MetricsTracker metricsTracker;

    public GlobalExceptionHandler(MetricsTracker metricsTracker) {
        this.metricsTracker = metricsTracker;
    }

    // Handle payload validation failures (JSR-380) with RFC-7807 Problem Detail
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidationExceptions(MethodArgumentNotValidException ex) {
        metricsTracker.incrementError();
        
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, 
                "Your request payload failed validation checks."
        );
        problemDetail.setTitle("Validation Failure");
        problemDetail.setType(URI.create("https://abysalto.com/errors/validation-failure"));
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        problemDetail.setProperty("invalid_fields", errors);
        problemDetail.setProperty("timestamp", Instant.now());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problemDetail);
    }

    // Handle invalid quantity input
    @ExceptionHandler(InvalidQuantityException.class)
    public ResponseEntity<ProblemDetail> handleInvalidQuantity(InvalidQuantityException ex) {
        metricsTracker.incrementError();

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
        problemDetail.setTitle("Invalid Quantity");
        problemDetail.setType(URI.create("https://abysalto.com/errors/invalid-quantity"));
        problemDetail.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problemDetail);
    }

    // Handle product not found
    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleProductNotFound(ProductNotFoundException ex) {
        metricsTracker.incrementError();

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
        problemDetail.setTitle("Product Not Found");
        problemDetail.setType(URI.create("https://abysalto.com/errors/product-not-found"));
        problemDetail.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problemDetail);
    }

    // Handle empty cart checkout
    @ExceptionHandler(EmptyCartCheckoutException.class)
    public ResponseEntity<ProblemDetail> handleEmptyCartCheckout(EmptyCartCheckoutException ex) {
        metricsTracker.incrementError();

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
        problemDetail.setTitle("Empty Cart Checkout");
        problemDetail.setType(URI.create("https://abysalto.com/errors/empty-cart-checkout"));
        problemDetail.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problemDetail);
    }

    // Handle cart immutable state (post-checkout modifications)
    @ExceptionHandler(CartImmutableException.class)
    public ResponseEntity<ProblemDetail> handleCartImmutable(CartImmutableException ex) {
        metricsTracker.incrementError();

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                ex.getMessage()
        );
        problemDetail.setTitle("Cart Is Immutable");
        problemDetail.setType(URI.create("https://abysalto.com/errors/cart-immutable"));
        problemDetail.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(problemDetail);
    }

    // Handle stock insufficiency
    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ProblemDetail> handleInsufficientStock(InsufficientStockException ex) {
        metricsTracker.incrementError();

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                ex.getMessage()
        );
        problemDetail.setTitle("Insufficient Stock");
        problemDetail.setType(URI.create("https://abysalto.com/errors/insufficient-stock"));
        problemDetail.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(problemDetail);
    }

    // Handle integration issues with the Catalog Service
    @ExceptionHandler(CatalogServiceException.class)
    public ResponseEntity<ProblemDetail> handleCatalogServiceError(CatalogServiceException ex) {
        metricsTracker.incrementError();

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_GATEWAY,
                ex.getMessage()
        );
        problemDetail.setTitle("Catalog Service Failure");
        problemDetail.setType(URI.create("https://abysalto.com/errors/catalog-service-failure"));
        problemDetail.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(problemDetail);
    }

    // Handle invalid business state or arguments (e.g., fallback for non-custom exceptions)
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ProblemDetail> handleBusinessExceptions(RuntimeException ex) {
        metricsTracker.incrementError();

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT, 
                ex.getMessage()
        );
        problemDetail.setTitle("Transaction or Business Conflict");
        problemDetail.setType(URI.create("https://abysalto.com/errors/business-conflict"));
        problemDetail.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(problemDetail);
    }

    // General fallback handler
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleAllOtherExceptions(Exception ex) {
        metricsTracker.incrementError();

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR, 
                "An unexpected server error occurred: " + ex.getMessage()
        );
        problemDetail.setTitle("Internal Server Error");
        problemDetail.setType(URI.create("https://abysalto.com/errors/internal-server-error"));
        problemDetail.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problemDetail);
    }
}
