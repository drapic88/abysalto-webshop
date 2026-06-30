package com.abysalto.catalog.controller;

import com.abysalto.catalog.domain.Product;
import com.abysalto.catalog.exception.ProductNotFoundException;
import com.abysalto.catalog.exception.InsufficientStockException;
import com.abysalto.catalog.repository.ProductRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/{productId}")
    @Cacheable(value = "products", key = "#productId")
    public Product getProductById(@PathVariable UUID productId) {
        System.out.println(">>> Cache Miss! Fetching product from Database: " + productId);
        return productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + productId));
    }

    @PutMapping("/{productId}/deduct-stock")
    @CacheEvict(value = "products", key = "#productId")
    public ResponseEntity<Void> deductStock(@PathVariable UUID productId, @RequestParam int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + productId));

        if (product.getStockQuantity() < quantity) {
            throw new InsufficientStockException("Insufficient stock for product " + product.getName() + ". Required: " + quantity + ", Available: " + product.getStockQuantity());
        }

        product.setStockQuantity(product.getStockQuantity() - quantity);
        productRepository.save(product);
        System.out.println(">>> Stock Deducted programmatically. Evicted cache for: " + productId);
        return ResponseEntity.ok().build();
    }
}
