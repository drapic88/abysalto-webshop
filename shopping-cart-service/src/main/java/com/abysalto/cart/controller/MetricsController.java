package com.abysalto.cart.controller;

import com.abysalto.cart.service.MetricsTracker;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/metrics")
public class MetricsController {

    private final MetricsTracker metricsTracker;

    public MetricsController(MetricsTracker metricsTracker) {
        this.metricsTracker = metricsTracker;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getSystemMetrics() {
        return ResponseEntity.ok(metricsTracker.getLiveSystemMetrics());
    }
}
