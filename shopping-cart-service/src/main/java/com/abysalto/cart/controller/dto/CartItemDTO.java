package com.abysalto.cart.controller.dto;

import com.abysalto.cart.domain.CartItem;
import java.math.BigDecimal;
import java.util.UUID;

public record CartItemDTO(
    UUID cartItemId,
    UUID productId,
    int quantity,
    BigDecimal unitPrice,
    String productName,
    String currency,
    BigDecimal subtotal
) {
    public static CartItemDTO fromEntity(CartItem item) {
        if (item == null) return null;
        return new CartItemDTO(
            item.getCartItemId(),
            item.getProductId(),
            item.getQuantity(),
            item.getUnitPrice(),
            item.getProductName(),
            item.getCurrency(),
            item.getSubtotal()
        );
    }
}
