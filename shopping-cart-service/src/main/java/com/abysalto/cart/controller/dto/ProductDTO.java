package com.abysalto.cart.controller.dto;

import com.abysalto.cart.domain.Product;
import java.math.BigDecimal;
import java.util.UUID;

public record ProductDTO(
    UUID productId,
    String name,
    String description,
    BigDecimal priceNumeric,
    String priceCurrency,
    String imageUrl,
    String category,
    int stockQuantity
) {
    public static ProductDTO fromEntity(Product product) {
        if (product == null) return null;
        return new ProductDTO(
            product.getProductId(),
            product.getName(),
            product.getDescription(),
            product.getPriceNumeric(),
            product.getPriceCurrency(),
            product.getImageUrl(),
            product.getCategory(),
            product.getStockQuantity()
        );
    }
}
