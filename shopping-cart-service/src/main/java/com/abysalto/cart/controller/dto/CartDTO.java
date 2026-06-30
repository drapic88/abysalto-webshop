package com.abysalto.cart.controller.dto;

import com.abysalto.cart.domain.Cart;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CartDTO(
    UUID cartId,
    List<CartItemDTO> items,
    BigDecimal subtotalAmount,
    BigDecimal taxRate,
    BigDecimal taxAmount,
    BigDecimal totalAmount,
    String currency,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static CartDTO fromEntity(Cart cart) {
        if (cart == null) return null;
        return new CartDTO(
            cart.getCartId(),
            cart.getItems() != null ? cart.getItems().stream().map(CartItemDTO::fromEntity).toList() : List.of(),
            cart.getSubtotalAmount(),
            cart.getTaxRate(),
            cart.getTaxAmount(),
            cart.getTotalAmount(),
            cart.getCurrency(),
            cart.getCreatedAt(),
            cart.getUpdatedAt()
        );
    }
}
