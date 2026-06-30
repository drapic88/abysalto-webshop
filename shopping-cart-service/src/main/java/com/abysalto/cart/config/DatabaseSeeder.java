package com.abysalto.cart.config;

import com.abysalto.cart.domain.Product;
import com.abysalto.cart.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    public DatabaseSeeder(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (productRepository.count() == 0) {
            List<Product> seedProducts = Arrays.asList(
                new Product(
                    UUID.fromString("11111111-1111-1111-1111-111111111111"),
                    "Apex Pro Mechanical Keyboard",
                    "OmniPoint 2.0 adjustable hyper-magnetic switches, OLED smart display, premium aluminum top plate, and beautiful dynamic per-key RGB backlighting.",
                    new BigDecimal("199.9900"),
                    "USD",
                    "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600&auto=format&fit=crop",
                    "Accessories",
                    150
                ),
                new Product(
                    UUID.fromString("22222222-2222-2222-2222-222222222222"),
                    "QuietComfort Noise-Canceling Headphones",
                    "Premium wireless over-ear headphones featuring world-class active noise canceling (ANC), high-fidelity audio, adjustable EQ, and up to 24-hour battery life.",
                    new BigDecimal("349.0000"),
                    "USD",
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
                    "Audio",
                    75
                ),
                new Product(
                    UUID.fromString("33333333-3333-3333-3333-333333333333"),
                    "MX Master 3S Ergonomic Mouse",
                    "High-precision wireless mouse with an 8K DPI track-on-glass sensor, quiet clicks, MagSpeed electromagnetic scrolling wheel, and multi-OS customization.",
                    new BigDecimal("99.9900"),
                    "USD",
                    "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600&auto=format&fit=crop",
                    "Accessories",
                    200
                ),
                new Product(
                    UUID.fromString("44444444-4444-4444-4444-444444444444"),
                    "UltraWide 34\" Curved Monitor",
                    "Immersive curved IPS monitor with 3440 x 1440 WQHD resolution, 144Hz refresh rate, HDR400, and USB-C power delivery for a seamless single-cable workspace setup.",
                    new BigDecimal("499.9900"),
                    "USD",
                    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop",
                    "Hardware",
                    40
                ),
                new Product(
                    UUID.fromString("55555555-5555-5555-5555-555555555555"),
                    "Stream Deck MK.2",
                    "Streamlined studio controller with 15 customizable LCD keys to trigger actions, launch social posts, adjust audio, and streamline video editing workflows.",
                    new BigDecimal("149.9900"),
                    "USD",
                    "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop",
                    "Accessories",
                    90
                ),
                new Product(
                    UUID.fromString("66666666-6666-6666-6666-666666666666"),
                    "4K Pro Ultra HD Webcam",
                    "Enterprise-class web camera capturing crystal-clear 4K resolution at 30 fps, featuring HDR, 5x digital zoom, dual noise-canceling microphones, and auto-lighting adjustment.",
                    new BigDecimal("199.0000"),
                    "USD",
                    "https://images.unsplash.com/photo-1601524909162-be87252be298?q=80&w=600&auto=format&fit=crop",
                    "Audio",
                    110
                ),
                new Product(
                    UUID.fromString("77777777-7777-7777-7777-777777777777"),
                    "Ergonomic Active Office Chair",
                    "Fully adjustable ergonomic office chair with breathable 3D mesh backing, adaptive lumbar support, 4D armrests, and dynamic synchro-tilt mechanism.",
                    new BigDecimal("320.0000"),
                    "USD",
                    "https://images.unsplash.com/photo-1505797149-43b0069ec26b?q=80&w=600&auto=format&fit=crop",
                    "Hardware",
                    30
                ),
                new Product(
                    UUID.fromString("88888888-8888-8888-8888-888888888888"),
                    "Portable 2TB NVMe External SSD",
                    "Ultra-fast solid state drive with up to 2000MB/s read/write speeds, heavy-duty drop-resistant aluminum chassis, and IP55 water and dust resistance.",
                    new BigDecimal("159.9900"),
                    "USD",
                    "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?q=80&w=600&auto=format&fit=crop",
                    "Hardware",
                    180
                ),
                new Product(
                    UUID.fromString("99999999-9999-9999-9999-999999999999"),
                    "Smart Watch Series 9",
                    "Sleek health and fitness tracker with an Always-On Retina display, blood oxygen and ECG readings, crash detection, automatic workout logging, and water resistance.",
                    new BigDecimal("399.0000"),
                    "USD",
                    "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=600&auto=format&fit=crop",
                    "Wearables",
                    120
                ),
                new Product(
                    UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    "Premium Wireless charging Hub",
                    "Sleek 3-in-1 fast-charging stand made from aerospace-grade aluminum, charging your smartphone, wireless earbuds, and smartwatch concurrently.",
                    new BigDecimal("79.5000"),
                    "USD",
                    "https://images.unsplash.com/photo-1622445262465-2481c4574875?q=80&w=600&auto=format&fit=crop",
                    "Accessories",
                    300
                )
            );
            productRepository.saveAll(seedProducts);
            System.out.println(">>> Seeded 10 premium products into the database successfully!");
        }
    }
}
