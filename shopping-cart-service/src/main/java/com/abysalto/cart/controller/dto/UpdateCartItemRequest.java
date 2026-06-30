package com.abysalto.cart.controller.dto;

import jakarta.validation.constraints.Min;

public record UpdateCartItemRequest(
    @Min(value = 1, message = "Quantity must be at least 1")
    int quantity
) {}
