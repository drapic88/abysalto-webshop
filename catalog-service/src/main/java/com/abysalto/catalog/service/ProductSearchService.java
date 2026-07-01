package com.abysalto.catalog.service;

import com.abysalto.catalog.domain.Product;
import com.abysalto.catalog.domain.ProductDocument;
import com.abysalto.catalog.repository.ProductSearchRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductSearchService {

    private final ProductSearchRepository searchRepository;
    private final ElasticsearchOperations elasticsearchOperations;

    public ProductSearchService(ProductSearchRepository searchRepository, ElasticsearchOperations elasticsearchOperations) {
        this.searchRepository = searchRepository;
        this.elasticsearchOperations = elasticsearchOperations;
    }

    public void indexProduct(Product product) {
        try {
            ProductDocument doc = new ProductDocument(
                    product.getProductId().toString(),
                    product.getName(),
                    product.getDescription(),
                    product.getPriceNumeric() != null ? product.getPriceNumeric().doubleValue() : 0.0,
                    product.getPriceCurrency(),
                    product.getImageUrl(),
                    product.getCategory(),
                    product.getStockQuantity()
            );
            searchRepository.save(doc);
            System.out.println(">>> Indexed product in Elasticsearch: " + product.getName());
        } catch (Exception e) {
            System.err.println(">>> Error indexing product in Elasticsearch: " + e.getMessage());
        }
    }

    public void updateStock(UUID productId, int newStock) {
        try {
            searchRepository.findById(productId.toString()).ifPresent(doc -> {
                doc.setStockQuantity(newStock);
                searchRepository.save(doc);
                System.out.println(">>> Updated stock in Elasticsearch for product " + doc.getName() + " to " + newStock);
            });
        } catch (Exception e) {
            System.err.println(">>> Error updating stock in Elasticsearch: " + e.getMessage());
        }
    }


    public void deleteProduct(UUID productId) {
        try {
            searchRepository.deleteById(productId.toString());
            System.out.println(">>> Deleted product from Elasticsearch: " + productId);
        } catch (Exception e) {
            System.err.println(">>> Error deleting product from Elasticsearch: " + e.getMessage());
        }
    }

    public Page<ProductDocument> search(String query, String category, int page, int size) {
        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(q -> q
                        .bool(b -> {
                            if (query != null && !query.trim().isEmpty()) {
                                b.must(m -> m
                                        .multiMatch(mm -> mm
                                                .fields("name^3", "description")
                                                .query(query)
                                                .fuzziness("AUTO")
                                        )
                                );
                            }
                            if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("All")) {
                                b.filter(f -> f
                                        .term(t -> t
                                                .field("category")
                                                .value(category)
                                        )
                                );
                            }
                            return b;
                        })
                )
                .withPageable(PageRequest.of(page, size))
                .build();

        try {
            SearchHits<ProductDocument> searchHits = elasticsearchOperations.search(nativeQuery, ProductDocument.class);
            List<ProductDocument> content = searchHits.get().map(SearchHit::getContent).collect(Collectors.toList());
            return new PageImpl<>(content, PageRequest.of(page, size), searchHits.getTotalHits());
        } catch (Exception e) {
            System.err.println(">>> Search query failed on Elasticsearch, falling back to empty page: " + e.getMessage());
            return Page.empty(PageRequest.of(page, size));
        }
    }
}
