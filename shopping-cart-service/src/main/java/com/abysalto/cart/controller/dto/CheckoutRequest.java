package com.abysalto.cart.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record CheckoutRequest(
    @NotBlank(message = "Customer name is required")
    String customerName,

    @NotBlank(message = "Shipping address is required")
    String shippingAddress
) {}
