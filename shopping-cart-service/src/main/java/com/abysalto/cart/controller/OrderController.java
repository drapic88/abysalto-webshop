package com.abysalto.cart.controller;

import com.abysalto.cart.controller.dto.CartDTO;
import com.abysalto.cart.repository.CartRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final CartRepository cartRepository;

    public OrderController(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    @GetMapping
    public ResponseEntity<List<CartDTO>> getAllOrders() {
        List<CartDTO> orders = cartRepository.findByCheckedOutAtIsNotNullOrderByCheckedOutAtDesc()
                .stream()
                .map(CartDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<CartDTO> getOrderById(@PathVariable UUID orderId) {
        return cartRepository.findByOrderId(orderId)
                .map(CartDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
