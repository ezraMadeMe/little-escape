package com.littleescape.little_escape;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.littleescape.external.kakao.KakaoProperties;

@EnableConfigurationProperties(KakaoProperties.class)
@SpringBootApplication
public class LittleEscapeApplication {

	public static void main(String[] args) {
		SpringApplication.run(LittleEscapeApplication.class, args);
	}

}

