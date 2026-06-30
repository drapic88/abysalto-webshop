package com.abysalto.cart.service;

import com.abysalto.cart.domain.Cart;
import com.abysalto.cart.domain.Product;
import com.abysalto.cart.repository.CartRepository;
import com.abysalto.cart.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final MetricsTracker metricsTracker;

    public CartService(CartRepository cartRepository, ProductRepository productRepository, MetricsTracker metricsTracker) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.metricsTracker = metricsTracker;
    }

    public Cart getOrCreateCart(UUID cartId) {
        return cartRepository.findById(cartId).orElseGet(() -> {
            Cart newCart = new Cart(cartId);
            Cart saved = cartRepository.save(newCart);
            metricsTracker.incrementActiveCarts();
            return saved;
        });
    }

    public Cart addItemToCart(UUID cartId, UUID productId, int quantity) {
        Cart cart = getOrCreateCart(cartId);
        if (!cart.isEditable()) {
            metricsTracker.incrementError();
            throw new IllegalStateException("Cannot modify a cart after checkout has been completed.");
        }
        if (quantity <= 0) {
            metricsTracker.incrementError();
            throw new IllegalArgumentException("Quantity must be greater than zero.");
        }
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> {
                    metricsTracker.incrementError();
                    return new IllegalArgumentException("Product not found with ID: " + productId);
                });

        if (product.getStockQuantity() < quantity) {
            metricsTracker.incrementError();
            throw new IllegalArgumentException("Insufficient stock for product: " + product.getName() + ". Available: " + product.getStockQuantity());
        }

        cart.addItem(product, quantity);
        metricsTracker.incrementItemsAdded(quantity);
        return cartRepository.save(cart);
    }

    public Cart updateItemQuantity(UUID cartId, UUID productId, int quantity) {
        Cart cart = getOrCreateCart(cartId);
        if (!cart.isEditable()) {
            metricsTracker.incrementError();
            throw new IllegalStateException("Cannot modify a cart after checkout has been completed.");
        }
        if (quantity <= 0) {
            metricsTracker.incrementError();
            throw new IllegalArgumentException("Quantity must be greater than zero.");
        }
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> {
                    metricsTracker.incrementError();
                    return new IllegalArgumentException("Product not found with ID: " + productId);
                });

        if (quantity > product.getStockQuantity()) {
            metricsTracker.incrementError();
            throw new IllegalArgumentException("Requested quantity of " + quantity + " exceeds available stock: " + product.getStockQuantity());
        }

        cart.updateItemQuantity(productId, quantity);
        return cartRepository.save(cart);
    }

    public Cart removeItemFromCart(UUID cartId, UUID productId) {
        Cart cart = getOrCreateCart(cartId);
        if (!cart.isEditable()) {
            metricsTracker.incrementError();
            throw new IllegalStateException("Cannot modify a cart after checkout has been completed.");
        }
        cart.removeItem(productId);
        return cartRepository.save(cart);
    }

    public Cart clearCart(UUID cartId) {
        Cart cart = getOrCreateCart(cartId);
        if (!cart.isEditable()) {
            metricsTracker.incrementError();
            throw new IllegalStateException("Cannot modify a cart after checkout has been completed.");
        }
        cart.clear();
        return cartRepository.save(cart);
    }

    public UUID checkoutCart(UUID cartId, String customerName, String shippingAddress) {
        Cart cart = getOrCreateCart(cartId);
        if (!cart.isEditable()) {
            metricsTracker.incrementError();
            throw new IllegalStateException("Cart has already been checked out.");
        }
        if (cart.getItems().isEmpty()) {
            metricsTracker.incrementError();
            throw new IllegalStateException("Cannot checkout an empty shopping cart.");
        }

        // Deduct inventory stock for each product in the cart
        for (var item : cart.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found during checkout: " + item.getProductId()));
            if (product.getStockQuantity() < item.getQuantity()) {
                metricsTracker.incrementError();
                throw new IllegalStateException("Insufficient stock for product " + product.getName() + " during checkout. Required: " + item.getQuantity());
            }
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            productRepository.save(product);
        }

        // Record total sales amount and update conversions
        metricsTracker.recordCheckout(cart.getTotalAmount());
        metricsTracker.decrementActiveCarts();

        // Create random order id to simulate order processing completion
        UUID orderId = UUID.randomUUID();

        // Asynchronously print transaction/PubSub simulation logs
        System.out.println(String.format(">>> [OrderCompletedEvent] Published Order Placement Event: ID=%s, Customer=%s, Total=%s",
                 orderId, customerName, cart.getTotalAmount()));

        // Mark the shopping cart as checked out
        cart.setCheckedOutAt(LocalDateTime.now());
        cartRepository.save(cart);

        return orderId;
    }
}
