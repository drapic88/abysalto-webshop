package com.abysalto.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "products")
public class Product implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "product_id")
    private UUID productId;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(name = "price_numeric", nullable = false, precision = 12, scale = 4)
    private BigDecimal priceNumeric;

    @Column(name = "price_currency", nullable = false, length = 3)
    private String priceCurrency = "USD";

    @Column(name = "image_url")
    private String imageUrl;

    private String category;

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity;

    public Product() {}

    public Product(UUID productId, String name, String description, BigDecimal priceNumeric, String priceCurrency, String imageUrl, String category, int stockQuantity) {
        this.productId = productId;
        this.name = name;
        this.description = description;
        this.priceNumeric = priceNumeric;
        this.priceCurrency = priceCurrency;
        this.imageUrl = imageUrl;
        this.category = category;
        this.stockQuantity = stockQuantity;
    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPriceNumeric() {
        return priceNumeric;
    }

    public void setPriceNumeric(BigDecimal priceNumeric) {
        this.priceNumeric = priceNumeric;
    }

    public String getPriceCurrency() {
        return priceCurrency;
    }

    public void setPriceCurrency(String priceCurrency) {
        this.priceCurrency = priceCurrency;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(int stockQuantity) {
        this.stockQuantity = stockQuantity;
    }
}
