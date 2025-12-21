package com.littleescape.external.kakao;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class KakaoLocalClient {

    private final RestClient restClient;

    public KakaoLocalClient(@Value("/c8cfaa70e5cc90f45eb7e7dbc652d9bb") String kakaoRestApiKey) {
        this.restClient = RestClient.builder()
                .baseUrl("https://dapi.kakao.com")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "KakaoAK " + kakaoRestApiKey)
                .build();
    }

    public String searchKeyword(String query, double lat, double lng, int radius) {
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v2/local/search/keyword.json")
                        .queryParam("query", query)
                        .queryParam("y", lat)
                        .queryParam("x", lng)
                        .queryParam("radius", radius)
                        .build())
                .retrieve()
                .body(String.class);
    }
}