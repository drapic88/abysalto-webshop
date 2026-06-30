package com.abysalto.cart;

import com.abysalto.cart.domain.Cart;
import com.abysalto.cart.domain.Product;
import com.abysalto.cart.repository.ProductRepository;
import com.abysalto.cart.service.CartService;
import com.abysalto.cart.service.MetricsTracker;
import com.abysalto.cart.domain.CartItem;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.math.BigDecimal;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ShoppingCartApplicationTests {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CartService cartService;

    @Autowired
    private MetricsTracker metricsTracker;

    @Test
    void contextLoads() {
        // Basic sanity check to verify spring boot bootstrapping
    }

    @Test
    void testSeededProductsCount() {
        long count = productRepository.count();
        assertEquals(10, count, "There should be exactly 10 seeded products loaded in the database on start!");
    }

    @Test
    void testCartCalculationsWithBigDecimal() {
        Product mockKeyboard = new Product(
                UUID.randomUUID(),
                "Apex Keyboard",
                "Mock Description",
                new BigDecimal("100.0000"),
                "USD",
                "",
                "Accessories",
                10
        );

        Product mockMouse = new Product(
                UUID.randomUUID(),
                "MX Mouse",
                "Mock Description",
                new BigDecimal("50.0000"),
                "USD",
                "",
                "Accessories",
                20
        );

        Cart cart = new Cart();
        
        // 1. Add 2 Keyboards: Subtotal = $200.00
        cart.addItem(mockKeyboard, 2);
        
        // 2. Add 1 Mouse: Subtotal = $200.00 + $50.00 = $250.00
        cart.addItem(mockMouse, 1);

        // Assert Subtotal is exactly $250.00 (with scale 4)
        assertEquals(0, new BigDecimal("250.0000").compareTo(cart.getSubtotalAmount()));

        // Assert Tax (20% default VAT) is exactly $50.00
        assertEquals(0, new BigDecimal("50.0000").compareTo(cart.getTaxAmount()));

        // Assert Grand Total (Subtotal + Tax) is exactly $300.00
        assertEquals(0, new BigDecimal("300.0000").compareTo(cart.getTotalAmount()));
    }

    @Test
    void testAddItemToCart_NegativeOrZeroQuantity_ThrowsException() {
        UUID cartId = UUID.randomUUID();
        Product testProduct = productRepository.save(new Product(
                UUID.randomUUID(), "Test Product", "Desc", BigDecimal.TEN, "USD", "", "Cat", 100
        ));

        assertThrows(IllegalArgumentException.class, () -> cartService.addItemToCart(cartId, testProduct.getProductId(), -1));
        assertThrows(IllegalArgumentException.class, () -> cartService.addItemToCart(cartId, testProduct.getProductId(), 0));
    }

    @Test
    void testUpdateItemQuantity_NegativeOrZeroQuantity_ThrowsException() {
        UUID cartId = UUID.randomUUID();
        Product testProduct = productRepository.save(new Product(
                UUID.randomUUID(), "Test Product 2", "Desc", BigDecimal.TEN, "USD", "", "Cat", 100
        ));

        cartService.addItemToCart(cartId, testProduct.getProductId(), 2);

        assertThrows(IllegalArgumentException.class, () -> cartService.updateItemQuantity(cartId, testProduct.getProductId(), -5));
        assertThrows(IllegalArgumentException.class, () -> cartService.updateItemQuantity(cartId, testProduct.getProductId(), 0));
    }

    @Test
    void testAddItemToCart_InsufficientStock_ThrowsException() {
        UUID cartId = UUID.randomUUID();
        Product testProduct = productRepository.save(new Product(
                UUID.randomUUID(), "Limited Product", "Desc", BigDecimal.TEN, "USD", "", "Cat", 5
        ));

        assertThrows(IllegalArgumentException.class, () -> cartService.addItemToCart(cartId, testProduct.getProductId(), 6));
    }

    @Test
    void testUpdateItemQuantity_InsufficientStock_ThrowsException() {
        UUID cartId = UUID.randomUUID();
        Product testProduct = productRepository.save(new Product(
                UUID.randomUUID(), "Limited Product 2", "Desc", BigDecimal.TEN, "USD", "", "Cat", 5
        ));

        cartService.addItemToCart(cartId, testProduct.getProductId(), 2);

        assertThrows(IllegalArgumentException.class, () -> cartService.updateItemQuantity(cartId, testProduct.getProductId(), 6));
    }

    @Test
    void testCheckout_EmptyCart_ThrowsException() {
        UUID cartId = UUID.randomUUID();
        assertThrows(IllegalStateException.class, () -> cartService.checkoutCart(cartId, "Customer", "Address"));
    }

    @Test
    void testCheckout_NonExistentProduct_ThrowsException() {
        UUID cartId = UUID.randomUUID();
        UUID fakeProductId = UUID.randomUUID();
        assertThrows(IllegalArgumentException.class, () -> cartService.addItemToCart(cartId, fakeProductId, 1));
    }

    @Test
    void testCartLockedAfterCheckout_PreventsModifications() {
        UUID cartId = UUID.randomUUID();
        Product testProduct = productRepository.save(new Product(
                UUID.randomUUID(), "Checkout Product", "Desc", BigDecimal.TEN, "USD", "", "Cat", 10
        ));

        cartService.addItemToCart(cartId, testProduct.getProductId(), 2);
        
        UUID orderId = cartService.checkoutCart(cartId, "John Doe", "123 Main St");
        assertNotNull(orderId);

        Cart cart = cartService.getOrCreateCart(cartId);
        assertNotNull(cart.getCheckedOutAt());
        assertFalse(cart.isEditable());

        assertThrows(IllegalStateException.class, () -> cartService.addItemToCart(cartId, testProduct.getProductId(), 1));
        assertThrows(IllegalStateException.class, () -> cartService.updateItemQuantity(cartId, testProduct.getProductId(), 3));
        assertThrows(IllegalStateException.class, () -> cartService.removeItemFromCart(cartId, testProduct.getProductId()));
        assertThrows(IllegalStateException.class, () -> cartService.clearCart(cartId));
        assertThrows(IllegalStateException.class, () -> cartService.checkoutCart(cartId, "John Doe", "123 Main St"));
    }

    @Test
    void testMetricsTrackerExtended() {
        // Reset or use a local mock, or verify increment behavior on the autowired bean
        long initialPurchases = metricsTracker.getCheckoutsCompletedCount();
        BigDecimal initialSales = metricsTracker.getTotalSalesVolume();

        CartItem item1 = new CartItem(null, UUID.randomUUID(), 3, new BigDecimal("10.00"), "Product A", "USD");
        CartItem item2 = new CartItem(null, UUID.randomUUID(), 1, new BigDecimal("25.00"), "Product B", "USD");

        metricsTracker.recordCheckout(new BigDecimal("55.00"), List.of(item1, item2));

        assertEquals(initialPurchases + 1, metricsTracker.getCheckoutsCompletedCount());
        assertEquals(initialSales.add(new BigDecimal("55.00")), metricsTracker.getTotalSalesVolume());

        CartItem item3 = new CartItem(null, UUID.randomUUID(), 2, new BigDecimal("100.00"), "Product A", "USD");
        metricsTracker.recordCheckout(new BigDecimal("200.00"), List.of(item3));

        // Verify products sold map
        Map<String, Long> productsSold = metricsTracker.getProductsSold();
        // Product A total should be 3 + 2 = 5
        assertEquals(5L, productsSold.get("Product A"));
        // Product B total should be 1
        assertEquals(1L, productsSold.get("Product B"));

        // Verify min/max/average
        assertEquals(0, new BigDecimal("55.00").compareTo(metricsTracker.getMinCartAmount()));
        assertEquals(0, new BigDecimal("200.00").compareTo(metricsTracker.getMaxCartAmount()));

        Map<String, Object> liveMetrics = metricsTracker.getLiveSystemMetrics();
        assertNotNull(liveMetrics.get("averageCartAmount"));
        assertNotNull(liveMetrics.get("minCartAmount"));
        assertNotNull(liveMetrics.get("maxCartAmount"));
        assertNotNull(liveMetrics.get("productsSold"));
        assertNotNull(liveMetrics.get("purchasesCount"));
    }
}

