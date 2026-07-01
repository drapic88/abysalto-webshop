package com.abysalto.catalog;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import com.abysalto.catalog.repository.ProductSearchRepository;
import org.springframework.data.redis.connection.RedisConnectionFactory;

@SpringBootTest(properties = {
    "spring.cache.type=none"
})
class CatalogApplicationTests {

    @MockBean
    private RedisConnectionFactory redisConnectionFactory;

    @MockBean
    private ElasticsearchOperations elasticsearchOperations;

    @MockBean
    private ProductSearchRepository productSearchRepository;

    @Test
    void contextLoads() {
        // Sanity check to verify the spring boot context loads successfully
    }
}
