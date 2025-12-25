package com.littleescape.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
        // 로컬 + 실디바이스(같은 네트워크)까지 허용하려면 patterns가 편함
        .allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*", "http://192.168.*:*", "http://10.*:*")
        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(false)
        .maxAge(3600);
  }
}
