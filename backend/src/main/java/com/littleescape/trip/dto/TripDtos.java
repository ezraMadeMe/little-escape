package com.littleescape.trip.dto;

import com.littleescape.trip.domain.TransportMode;
import jakarta.validation.constraints.*;

import java.util.List;

public class TripDtos {

    public record LatLng(
            @NotNull Double lat,
            @NotNull Double lng
    ) {}

    public record Budget(
            @NotBlank String type,
            @Min(5) int value
    ) {}

    public record TripSessionCreateRequest(
            @NotNull TransportMode mode,
            @NotNull LatLng origin,
            @NotNull Budget budget,
            String constraintsJson,
            List<String> moodTags
    ) {}

    public record CandidateCard(
            Long candidateId,
            String destName,
            String areaName,
            double destLat,
            double destLng,
            double score,
            String poiJson,
            Integer estDurationMin
    ) {}

    public record TripSessionCreateResponse(
            Long sessionId,
            List<CandidateCard> recommendations
    ) {}

    public record RejectRequest(@NotNull Long candidateId) {}
    public record RejectResponse(List<CandidateCard> recommendations) {}

    public record AcceptRequest(@NotNull Long candidateId) {}

    public record RouteDto(
            int distanceM,
            int durationSec,
            String polyline
    ) {}

    public record NavigationDto(
            String provider,
            String deeplinkUrl
    ) {}

    public record AcceptResponse(
            Long acceptedCandidateId,
            RouteDto route,
            NavigationDto navigation
    ) {}

    public record CompleteResponse(String status) {}
}