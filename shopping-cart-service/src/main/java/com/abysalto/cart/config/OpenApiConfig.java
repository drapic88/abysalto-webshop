package com.abysalto.cart.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI shoppingCartServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Abysalto Webshop - Shopping Cart Service API")
                        .description("API Documentation for managing shopping carts, adding/updating products, checkout flows, and retail metrics tracking.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Abysalto Dev Team")
                                .email("dev-team@abysalto.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development Server"),
                        new Server().url("http://shopping-cart-service:8080").description("Docker Internal Network")
                ));
    }
}
