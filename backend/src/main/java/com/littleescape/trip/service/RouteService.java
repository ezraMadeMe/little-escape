package com.littleescape.trip.service;

import com.littleescape.route.domain.RoutePlan;
import com.littleescape.route.external.KakaoMobilityClient;
import com.littleescape.route.repo.RoutePlanRepository;
import com.littleescape.trip.domain.TransportMode;
import com.littleescape.trip.domain.TripSession;
import org.springframework.stereotype.Service;

@Service
public class RouteService {
    private final RoutePlanRepository routePlanRepository;

    public RouteService(KakaoMobilityClient mobilityClient, RoutePlanRepository routePlanRepository) {
        this.routePlanRepository = routePlanRepository;
    }

    public RecommendationService.RouteResult tryBuildRoute(TripSession session, CandidateGenerator.CandidateSeed seed) {
        if (session.getMode() == TransportMode.TRANSIT) {
            int estMin = estimateTransitMinutes(session, seed.destLat(), seed.destLng());
            boolean ok = estMin <= session.getBudgetValue();
            return new RecommendationService.RouteResult(ok, null, estMin);
        }

        int distanceM = 10000;
        int durationSec = 1200;
        String polyline = "";
        String metaJson = "{}";

        int roundTripMin = (durationSec * 2) / 60;
        if (roundTripMin > session.getBudgetValue()) {
            return new RecommendationService.RouteResult(false, null, null);
        }

        RoutePlan plan = new RoutePlan("KAKAO_MOBILITY", distanceM, durationSec, polyline, metaJson);
        routePlanRepository.save(plan);

        return new RecommendationService.RouteResult(true, plan.getId(), durationSec / 60);
    }

    private int estimateTransitMinutes(TripSession session, double dLat, double dLng) {
        // TODO: 직선거리 기반 근사
        return 35;
    }
}