package com.abysalto.cart.exception;

public class ProductNotFoundException extends ShoppingCartException {
    public ProductNotFoundException(String message) {
        super(message);
    }
}
