package com.swcom.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("One Person Company Management System API")
                        .version("1.0.0")
                        .description("API documentation for managing AI employees, tasks, projects, and contracts")
                        .contact(new Contact()
                                .name("SWCOM")
                                .email("admin@swcom.com")));
    }
}
