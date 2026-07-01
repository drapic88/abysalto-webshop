package com.abysalto.catalog.config;

import com.abysalto.catalog.domain.Product;
import com.abysalto.catalog.domain.ProductDocument;
import com.abysalto.catalog.repository.ProductRepository;
import com.abysalto.catalog.repository.ProductSearchRepository;
import com.abysalto.catalog.service.ProductSearchService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ElasticsearchIndexInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final ProductSearchRepository searchRepository;
    private final ProductSearchService productSearchService;
    private final ElasticsearchOperations elasticsearchOperations;

    public ElasticsearchIndexInitializer(ProductRepository productRepository, 
                                         ProductSearchRepository searchRepository, 
                                         ProductSearchService productSearchService,
                                         ElasticsearchOperations elasticsearchOperations) {
        this.productRepository = productRepository;
        this.searchRepository = searchRepository;
        this.productSearchService = productSearchService;
        this.elasticsearchOperations = elasticsearchOperations;
    }

    @Override
    public void run(String... args) {
        new Thread(() -> {
            try {
                // Give Elasticsearch 8 seconds to fully start and settle
                Thread.sleep(8000);
                
                try {
                    var indexOps = elasticsearchOperations.indexOps(ProductDocument.class);
                    if (!indexOps.exists()) {
                        System.out.println(">>> Elasticsearch index 'products' does not exist. Creating with mapped schema...");
                        indexOps.createWithMapping();
                        System.out.println(">>> Elasticsearch index 'products' created successfully.");
                    }
                } catch (Exception e) {
                    System.err.println(">>> Could not check or create index ops: " + e.getMessage());
                }

                long esDocCount = 0;
                try {
                    esDocCount = searchRepository.count();
                } catch (Exception e) {
                    System.err.println(">>> Could not query Elasticsearch count (index might not exist yet): " + e.getMessage());
                }

                long dbCount = productRepository.count();
                System.out.println(">>> Relational DB Product Count: " + dbCount + " | Elasticsearch Product Document Count: " + esDocCount);

                if (esDocCount == 0 && dbCount > 0) {
                    System.out.println(">>> Elasticsearch index is empty but database contains products. Initiating bulk re-indexing of " + dbCount + " items...");
                    List<Product> allProducts = productRepository.findAll();
                    int count = 0;
                    for (Product product : allProducts) {
                        productSearchService.indexProduct(product);
                        count++;
                        if (count % 100 == 0) {
                            System.out.println(">>> Indexed " + count + " / " + dbCount + " products...");
                        }
                    }
                    System.out.println(">>> Bulk re-indexing to Elasticsearch completed successfully! Total indexed: " + count);
                } else if (dbCount > 0) {
                    System.out.println(">>> Elasticsearch index already initialized with " + esDocCount + " documents. Skipping bulk indexing.");
                }
            } catch (Exception e) {
                System.err.println(">>> ElasticsearchIndexInitializer background task encountered an error: " + e.getMessage());
            }
        }).start();
    }
}

