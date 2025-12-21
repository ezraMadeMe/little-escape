package com.littleescape.route.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public class RouteDtos {

    public record CarRouteRequest(
            @NotNull Double originLat,
            @NotNull Double originLng,
            @NotNull Double destLat,
            @NotNull Double destLng
    ) {}

    public record LatLng(double lat, double lng) {}

    public record CarRouteResponse(
            int distanceM,
            int durationSec,
            List<LatLng> path
    ) {}
}
