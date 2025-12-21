package com.littleescape.trip.controller;

import com.littleescape.common.api.ApiResponse;
import com.littleescape.trip.dto.TripDtos;
import com.littleescape.trip.service.TripSessionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/trip-sessions")
public class TripController {

    private final TripSessionService tripSessionService;

    public TripController(TripSessionService tripSessionService) {
        this.tripSessionService = tripSessionService;
    }

    @PostMapping
    public ApiResponse<TripDtos.TripSessionCreateResponse> create(
            @RequestHeader("X-USER-ID") Long userId,
            @Valid @RequestBody TripDtos.TripSessionCreateRequest req
    ) {
        return ApiResponse.ok(tripSessionService.createSession(userId, req));
    }

    @PostMapping("/{sessionId}/reject")
    public ApiResponse<TripDtos.RejectResponse> reject(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long sessionId,
            @Valid @RequestBody TripDtos.RejectRequest req
    ) {
        return ApiResponse.ok(tripSessionService.reject(userId, sessionId, req));
    }

    @PostMapping("/{sessionId}/accept")
    public ApiResponse<TripDtos.AcceptResponse> accept(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long sessionId,
            @Valid @RequestBody TripDtos.AcceptRequest req
    ) {
        return ApiResponse.ok(tripSessionService.accept(userId, sessionId, req));
    }

    @PostMapping("/{sessionId}/complete")
    public ApiResponse<TripDtos.CompleteResponse> complete(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long sessionId
    ) {
        return ApiResponse.ok(tripSessionService.complete(userId, sessionId));
    }
}