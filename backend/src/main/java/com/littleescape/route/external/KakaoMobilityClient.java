package com.littleescape.route.external;

import com.littleescape.external.kakao.KakaoProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class KakaoMobilityClient {

    private final RestClient restClient;

    public KakaoMobilityClient(KakaoProperties props) {
        this.restClient = RestClient.builder()
                .baseUrl("https://apis-navi.kakaomobility.com")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "KakaoAK " + props.getMobilityApiKey())
                .build();
    }

    public String directionsRaw(double oLng, double oLat, double dLng, double dLat) {
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1/directions")
                        .queryParam("origin", oLng + "," + oLat)
                        .queryParam("destination", dLng + "," + dLat)
                        .queryParam("summary", "false")
                        .queryParam("priority", "RECOMMEND")
                        .build())
                .retrieve()
                .body(String.class);
    }
}