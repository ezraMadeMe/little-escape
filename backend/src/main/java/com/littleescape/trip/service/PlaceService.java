package com.littleescape.trip.service;

import com.littleescape.external.kakao.KakaoLocalClient;
import org.springframework.stereotype.Service;

@Service
public class PlaceService {

    private final KakaoLocalClient kakaoLocalClient;

    public PlaceService(KakaoLocalClient kakaoLocalClient) {
        this.kakaoLocalClient = kakaoLocalClient;
    }

    public String fetchNearbyPoiJson(double lat, double lng) {
        // TODO: 실제로는 여러 카테고리/키워드 믹스 추천
        return kakaoLocalClient.searchKeyword("맛집", lat, lng, 1500);
    }
}