package com.abysalto.cart.exception;

public class ShoppingCartException extends RuntimeException {
    public ShoppingCartException(String message) {
        super(message);
    }

    public ShoppingCartException(String message, Throwable cause) {
        super(message, cause);
    }
}
