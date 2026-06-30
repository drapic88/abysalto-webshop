package com.abysalto.cart.exception;

public class EmptyCartCheckoutException extends ShoppingCartException {
    public EmptyCartCheckoutException(String message) {
        super(message);
    }
}
