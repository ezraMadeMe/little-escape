package com.littleescape.trip.service;

import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class NavigationLinkService {

    public String buildKakaoMapRouteLink(double oLat, double oLng, double dLat, double dLng, String mode) {
        // 예시 형태: kakaomap://route?sp=lat,lng&ep=lat,lng&by=CAR
        String by = mode.equals("TRANSIT") ? "PUBLICTRANSIT" : "CAR";

        return UriComponentsBuilder.newInstance()
                .scheme("kakaomap")
                .host("route")
                .queryParam("sp", oLat + "," + oLng)
                .queryParam("ep", dLat + "," + dLng)
                .queryParam("by", by)
                .build()
                .toUriString();
    }
}