package com.abysalto.cart.controller;

import com.abysalto.cart.controller.dto.CheckoutRequest;
import com.abysalto.cart.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/carts")
public class CheckoutController {

    private final CartService cartService;

    public CheckoutController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping("/{cartId}/checkout")
    public ResponseEntity<Map<String, String>> checkoutCart(
            @PathVariable UUID cartId,
            @Valid @RequestBody CheckoutRequest request) {
        UUID orderId = cartService.checkoutCart(cartId, request.customerName(), request.shippingAddress());
        return ResponseEntity.ok(Map.of(
                "orderId", orderId.toString(),
                "status", "SUCCESS",
                "message", "Order placed successfully! Transaction event published to Pub/Sub."
        ));
    }
}
