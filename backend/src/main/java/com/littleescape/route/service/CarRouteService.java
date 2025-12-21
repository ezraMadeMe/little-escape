package com.littleescape.route.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.littleescape.route.dto.RouteDtos;
import com.littleescape.route.external.KakaoMobilityClient;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CarRouteService {

    private final KakaoMobilityClient mobilityClient;
    private final ObjectMapper objectMapper;

    public CarRouteService(KakaoMobilityClient mobilityClient, ObjectMapper objectMapper) {
        this.mobilityClient = mobilityClient;
        this.objectMapper = objectMapper;
    }

    public RouteDtos.CarRouteResponse getCarRoute(RouteDtos.CarRouteRequest req) {
        String raw = mobilityClient.directionsRaw(
                req.originLng(), req.originLat(),
                req.destLng(), req.destLat()
        );

        try {
            JsonNode root = objectMapper.readTree(raw);
            JsonNode route0 = root.path("routes").path(0);
            JsonNode summary = route0.path("summary");

            int distance = summary.path("distance").asInt(0);
            int duration = summary.path("duration").asInt(0);

            List<RouteDtos.LatLng> path = new ArrayList<>();

            for (JsonNode section : route0.path("sections")) {
                for (JsonNode road : section.path("roads")) {
                    JsonNode vertexes = road.path("vertexes");
                    // vertexes: [x,y,x,y,...] (x=경도, y=위도) :contentReference[oaicite:2]{index=2}
                    for (int i = 0; i + 1 < vertexes.size(); i += 2) {
                        double x = vertexes.get(i).asDouble();     // lng
                        double y = vertexes.get(i + 1).asDouble(); // lat
                        path.add(new RouteDtos.LatLng(y, x));
                    }
                }
            }

            return new RouteDtos.CarRouteResponse(distance, duration, path);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Kakao Mobility response", e);
        }
    }
}
