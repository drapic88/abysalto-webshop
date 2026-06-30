package com.abysalto.cart.exception;

public class InsufficientStockException extends ShoppingCartException {
    public InsufficientStockException(String message) {
        super(message);
    }
}
