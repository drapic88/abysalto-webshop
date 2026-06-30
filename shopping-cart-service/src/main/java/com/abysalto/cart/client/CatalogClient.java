package com.abysalto.cart.client;

import com.abysalto.cart.exception.CatalogServiceException;
import com.abysalto.cart.domain.Product;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Optional;
import java.util.UUID;

@Component
public class CatalogClient {

    private final RestClient restClient;

    public CatalogClient(@Value("${catalog.service.url}") String catalogServiceUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(catalogServiceUrl)
                .build();
    }

    public Optional<Product> getProduct(UUID productId) {
        try {
            Product product = restClient.get()
                    .uri("/api/products/{productId}", productId)
                    .retrieve()
                    .body(Product.class);
            return Optional.ofNullable(product);
        } catch (RestClientException e) {
            System.err.println(">>> Error fetching product " + productId + " from Catalog Service: " + e.getMessage());
            return Optional.empty();
        }
    }

    public void deductStock(UUID productId, int quantity) {
        try {
            restClient.put()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/products/{productId}/deduct-stock")
                            .queryParam("quantity", quantity)
                            .build(productId))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            throw new CatalogServiceException("Failed to deduct stock for product " + productId + " in Catalog Service: " + e.getMessage(), e);
        }
    }
}
