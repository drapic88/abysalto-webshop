package com.abysalto.cart.controller;

import com.abysalto.cart.controller.dto.AddCartItemRequest;
import com.abysalto.cart.controller.dto.CartDTO;
import com.abysalto.cart.controller.dto.UpdateCartItemRequest;
import com.abysalto.cart.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/carts")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/{cartId}")
    public ResponseEntity<CartDTO> getOrCreateCart(@PathVariable UUID cartId) {
        return ResponseEntity.ok(CartDTO.fromEntity(cartService.getOrCreateCart(cartId)));
    }

    @PostMapping("/{cartId}/items")
    public ResponseEntity<CartDTO> addItemToCart(
            @PathVariable UUID cartId,
            @Valid @RequestBody AddCartItemRequest request) {
        return ResponseEntity.ok(CartDTO.fromEntity(cartService.addItemToCart(cartId, request.productId(), request.quantity())));
    }

    @PutMapping("/{cartId}/items/{productId}")
    public ResponseEntity<CartDTO> updateItemQuantity(
            @PathVariable UUID cartId,
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        return ResponseEntity.ok(CartDTO.fromEntity(cartService.updateItemQuantity(cartId, productId, request.quantity())));
    }

    @DeleteMapping("/{cartId}/items/{productId}")
    public ResponseEntity<CartDTO> removeItemFromCart(
            @PathVariable UUID cartId,
            @PathVariable UUID productId) {
        return ResponseEntity.ok(CartDTO.fromEntity(cartService.removeItemFromCart(cartId, productId)));
    }

    @DeleteMapping("/{cartId}")
    public ResponseEntity<CartDTO> clearCart(@PathVariable UUID cartId) {
        return ResponseEntity.ok(CartDTO.fromEntity(cartService.clearCart(cartId)));
    }
}

