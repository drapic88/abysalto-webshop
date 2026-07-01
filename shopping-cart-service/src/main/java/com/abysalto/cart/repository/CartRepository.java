package com.abysalto.cart.repository;

import com.abysalto.cart.domain.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartRepository extends JpaRepository<Cart, UUID> {
    List<Cart> findByCheckedOutAtIsNotNullOrderByCheckedOutAtDesc();
    Optional<Cart> findByOrderId(UUID orderId);
}
