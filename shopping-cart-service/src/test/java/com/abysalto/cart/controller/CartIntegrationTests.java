package com.abysalto.cart.controller;

import com.abysalto.cart.domain.Cart;
import com.abysalto.cart.domain.Product;
import com.abysalto.cart.repository.CartRepository;
import com.abysalto.cart.repository.ProductRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class CartIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Product testProduct;

    @BeforeEach
    void setUp() {
        // Clear carts first to maintain test isolation
        cartRepository.deleteAll();

        // Create and save a live product in the DB for integration testing
        testProduct = new Product(
                UUID.randomUUID(),
                "Integration Test Product",
                "Integration Desc",
                new BigDecimal("12.5000"),
                "USD",
                "",
                "Integration",
                20
        );
        productRepository.save(testProduct);
    }

    @Test
    void testGetOrCreateCartEndpoint_Success() throws Exception {
        UUID cartId = UUID.randomUUID();

        mockMvc.perform(get("/api/carts/" + cartId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cartId", is(cartId.toString())))
                .andExpect(jsonPath("$.items", hasSize(0)))
                .andExpect(jsonPath("$.totalAmount", is(0.0)));

        // Verify it was persisted to H2 DB
        assertTrue(cartRepository.findById(cartId).isPresent());
    }

    @Test
    void testAddItemToCartEndpoint_Success() throws Exception {
        UUID cartId = UUID.randomUUID();
        Map<String, Object> request = Map.of(
                "productId", testProduct.getProductId(),
                "quantity", 3
        );

        mockMvc.perform(post("/api/carts/" + cartId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].productName", is("Integration Test Product")))
                .andExpect(jsonPath("$.items[0].quantity", is(3)))
                .andExpect(jsonPath("$.subtotalAmount", is(37.5))) // 3 * 12.50
                .andExpect(jsonPath("$.taxAmount", is(7.5))) // 37.5 * 0.20
                .andExpect(jsonPath("$.totalAmount", is(45.0))); // 37.5 + 7.5
    }

    @Test
    void testAddItemToCartEndpoint_InvalidQuantity_ReturnsBadRequest() throws Exception {
        UUID cartId = UUID.randomUUID();
        Map<String, Object> request = Map.of(
                "productId", testProduct.getProductId(),
                "quantity", 0 // Invalid quantity via controller validation
        );

        mockMvc.perform(post("/api/carts/" + cartId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUpdateItemQuantityEndpoint_Success() throws Exception {
        UUID cartId = UUID.randomUUID();
        // Add item first
        Map<String, Object> addRequest = Map.of(
                "productId", testProduct.getProductId(),
                "quantity", 2
        );
        mockMvc.perform(post("/api/carts/" + cartId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addRequest)))
                .andExpect(status().isOk());

        // Update item quantity
        Map<String, Object> updateRequest = Map.of("quantity", 5);

        mockMvc.perform(put("/api/carts/" + cartId + "/items/" + testProduct.getProductId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].quantity", is(5)))
                .andExpect(jsonPath("$.totalAmount", is(75.0))); // 5 * 12.50 * 1.20
    }

    @Test
    void testCheckoutCartEndpoint_Success() throws Exception {
        UUID cartId = UUID.randomUUID();
        // Add item to cart
        Map<String, Object> addRequest = Map.of(
                "productId", testProduct.getProductId(),
                "quantity", 4
        );
        mockMvc.perform(post("/api/carts/" + cartId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addRequest)))
                .andExpect(status().isOk());

        // Checkout
        Map<String, String> checkoutRequest = Map.of(
                "customerName", "Jane Doe",
                "shippingAddress", "456 Oak Ave"
        );

        mockMvc.perform(post("/api/carts/" + cartId + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.orderId", notNullValue()));

        // Assert checkout timestamp is updated and stock is deducted
        Cart cart = cartRepository.findById(cartId).orElseThrow();
        assertNotNull(cart.getCheckedOutAt());
        assertFalse(cart.isEditable());

        Product updatedProduct = productRepository.findById(testProduct.getProductId()).orElseThrow();
        assertEquals(16, updatedProduct.getStockQuantity()); // 20 - 4
    }

    @Test
    void testCheckoutCart_LockedCartModification_ReturnsConflict() throws Exception {
        UUID cartId = UUID.randomUUID();
        Map<String, Object> addRequest = Map.of(
                "productId", testProduct.getProductId(),
                "quantity", 1
        );
        mockMvc.perform(post("/api/carts/" + cartId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addRequest)))
                .andExpect(status().isOk());

        Map<String, String> checkoutRequest = Map.of(
                "customerName", "Jane Doe",
                "shippingAddress", "456 Oak Ave"
        );
        mockMvc.perform(post("/api/carts/" + cartId + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isOk());

        // Subsequent modifications should fail
        mockMvc.perform(post("/api/carts/" + cartId + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addRequest)))
                .andExpect(status().isConflict()); // Map to conflict or bad request via GlobalExceptionHandler
    }
}
