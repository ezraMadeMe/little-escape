package com.littleescape.api.domain.type;

public final class RecommendationRadiusPolicy {

    public static final int DEFAULT_SEARCH_RADIUS_KM = 10;

    private RecommendationRadiusPolicy() {
    }

    public static int resolveSearchRadius(Integer searchRadius) {
        if (searchRadius == null || searchRadius <= 0) {
            return DEFAULT_SEARCH_RADIUS_KM;
        }
        return searchRadius;
    }
}
