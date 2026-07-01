package com.abysalto.catalog.controller;

import com.abysalto.catalog.domain.Product;
import com.abysalto.catalog.domain.ProductDocument;
import com.abysalto.catalog.repository.ProductRepository;
import com.abysalto.catalog.repository.ProductSearchRepository;
import com.abysalto.catalog.service.ProductSearchService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.cache.type=none"
})
@AutoConfigureMockMvc
public class ProductSearchIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @MockBean
    private ProductSearchService productSearchService;

    @MockBean
    private RedisConnectionFactory redisConnectionFactory;

    @MockBean
    private ElasticsearchOperations elasticsearchOperations;

    @MockBean
    private ProductSearchRepository productSearchRepository;

    private Product dbProduct1;
    private Product dbProduct2;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();

        dbProduct1 = new Product(
                UUID.randomUUID(),
                "Apex Pro Mechanical Keyboard",
                "Fuzzy search keyboard with customizable switches",
                new BigDecimal("199.9900"),
                "USD",
                "http://example.com/apex.jpg",
                "Accessories",
                150
        );

        dbProduct2 = new Product(
                UUID.randomUUID(),
                "Comfort Noise-Canceling Headphones",
                "Noise-canceling headphones for deep focus",
                new BigDecimal("349.0000"),
                "USD",
                "http://example.com/headphones.jpg",
                "Audio",
                75
        );

        productRepository.saveAll(List.of(dbProduct1, dbProduct2));
    }

    @Test
    void testSearchProducts_ElasticsearchSuccess_ReturnsElasticsearchResults() throws Exception {
        ProductDocument doc = new ProductDocument(
                dbProduct1.getProductId().toString(),
                "Apex Pro Mechanical Keyboard",
                "Fuzzy search keyboard with customizable switches",
                199.99,
                "USD",
                "http://example.com/apex.jpg",
                "Accessories",
                150
        );

        when(productSearchService.search("Apex", null, 0, 10))
                .thenReturn(new PageImpl<>(List.of(doc), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/products/search")
                        .param("query", "Apex")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].productId", is(dbProduct1.getProductId().toString())))
                .andExpect(jsonPath("$.content[0].name", is("Apex Pro Mechanical Keyboard")))
                .andExpect(jsonPath("$.content[0].category", is("Accessories")))
                .andExpect(jsonPath("$.totalElements", is(1)));

        verify(productSearchService, times(1)).search("Apex", null, 0, 10);
    }

    @Test
    void testSearchProducts_ElasticsearchFails_FallsBackToDatabaseSearch() throws Exception {
        // Force search service exception
        when(productSearchService.search("Comfort", null, 0, 10))
                .thenThrow(new RuntimeException("Elasticsearch is currently unavailable"));

        mockMvc.perform(get("/api/products/search")
                        .param("query", "Comfort")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].productId", is(dbProduct2.getProductId().toString())))
                .andExpect(jsonPath("$.content[0].name", is("Comfort Noise-Canceling Headphones")))
                .andExpect(jsonPath("$.content[0].category", is("Audio")))
                .andExpect(jsonPath("$.totalElements", is(1)));

        verify(productSearchService, times(1)).search("Comfort", null, 0, 10);
    }

    @Test
    void testSearchProducts_NoQuery_ReturnsAllProductsFromElasticsearch() throws Exception {
        ProductDocument doc1 = new ProductDocument(
                dbProduct1.getProductId().toString(),
                dbProduct1.getName(),
                dbProduct1.getDescription(),
                199.99,
                "USD",
                dbProduct1.getImageUrl(),
                dbProduct1.getCategory(),
                150
        );
        ProductDocument doc2 = new ProductDocument(
                dbProduct2.getProductId().toString(),
                dbProduct2.getName(),
                dbProduct2.getDescription(),
                349.00,
                "USD",
                dbProduct2.getImageUrl(),
                dbProduct2.getCategory(),
                75
        );

        when(productSearchService.search(null, null, 0, 10))
                .thenReturn(new PageImpl<>(List.of(doc1, doc2), PageRequest.of(0, 10), 2));

        mockMvc.perform(get("/api/products/search")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalElements", is(2)));
    }
}
