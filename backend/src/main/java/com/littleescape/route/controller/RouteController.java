package com.littleescape.route.controller;

import com.littleescape.common.api.ApiResponse;
import com.littleescape.route.dto.RouteDtos;
import com.littleescape.route.service.CarRouteService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/routes")
public class RouteController {

    private final CarRouteService carRouteService;

    public RouteController(CarRouteService carRouteService) {
        this.carRouteService = carRouteService;
    }

    @PostMapping("/car")
    public ApiResponse<RouteDtos.CarRouteResponse> car(@Valid @RequestBody RouteDtos.CarRouteRequest req) {
        return ApiResponse.ok(carRouteService.getCarRoute(req));
    }
}
