package com.littleescape.trip.service;

import com.littleescape.trip.domain.TripSession;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class CandidateGenerator {

    public List<CandidateSeed> generate(TripSession session, int count) {
        List<CandidateSeed> list = new ArrayList<>();
        double baseLat = session.getOriginLat();
        double baseLng = session.getOriginLng();

        for (int i = 0; i < count; i++) {
            double dLat = randBetween(-0.03, 0.03);
            double dLng = randBetween(-0.03, 0.03);
            list.add(new CandidateSeed(
                    baseLat + dLat,
                    baseLng + dLng,
                    "랜덤 목적지",
                    "근처 지역"
            ));
        }
        return list;
    }

    private double randBetween(double min, double max) {
        return ThreadLocalRandom.current().nextDouble(min, max);
    }

    public record CandidateSeed(double destLat, double destLng, String destName, String areaName) {}
}