package com.littleescape.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

import jakarta.annotation.PostConstruct;

import java.time.LocalDateTime;
import java.util.TimeZone;

@EnableScheduling
@SpringBootApplication
@EnableJpaAuditing
public class BackendApplication {

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
        System.out.println("현재 서버 시간: " + LocalDateTime.now());
    }

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

}
