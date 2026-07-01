package com.abysalto.catalog.controller;

import com.abysalto.catalog.domain.Product;
import com.abysalto.catalog.domain.ProductDocument;
import com.abysalto.catalog.exception.ProductNotFoundException;
import com.abysalto.catalog.exception.InsufficientStockException;
import com.abysalto.catalog.repository.ProductRepository;
import com.abysalto.catalog.service.ProductSearchService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@Tag(name = "Product Catalog API", description = "Endpoints for retrieving products and managing inventory stock")
public class ProductController {

    private final ProductRepository productRepository;
    private final ProductSearchService productSearchService;

    public ProductController(ProductRepository productRepository, ProductSearchService productSearchService) {
        this.productRepository = productRepository;
        this.productSearchService = productSearchService;
    }

    @GetMapping
    @Operation(summary = "Get paginated products", description = "Retrieves a paginated list of catalog products")
    public Page<Product> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return productRepository.findAll(PageRequest.of(page, size));
    }

    @GetMapping("/search")
    @Operation(summary = "Search products via Elasticsearch", description = "Performs multi-match fuzzy search on name and description with optional category filtering")
    public Page<ProductDocument> searchProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            return productSearchService.search(query, category, page, size);
        } catch (Exception e) {
            System.err.println(">>> Elasticsearch search failed, falling back to database search: " + e.getMessage());
            Page<Product> dbProducts = productRepository.searchProducts(query, category, PageRequest.of(page, size));
            return dbProducts.map(this::mapToDocument);
        }
    }

    private ProductDocument mapToDocument(Product product) {
        return new ProductDocument(
                product.getProductId().toString(),
                product.getName(),
                product.getDescription(),
                product.getPriceNumeric() != null ? product.getPriceNumeric().doubleValue() : 0.0,
                product.getPriceCurrency(),
                product.getImageUrl(),
                product.getCategory(),
                product.getStockQuantity()
        );
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
        
        // Sync with Elasticsearch
        productSearchService.updateStock(productId, product.getStockQuantity());
        
        return ResponseEntity.ok().build();
    }
}

