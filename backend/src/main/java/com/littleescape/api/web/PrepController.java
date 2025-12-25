package com.littleescape.api.web;

import com.littleescape.api.service.PrepService;
import com.littleescape.api.web.dto.PrepDtos.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/appointments")
public class PrepController {

  private final PrepService prepService;

  public PrepController(PrepService prepService) {
    this.prepService = prepService;
  }

  // 전날 준비 + 후보 생성(최대 5개)
  @PostMapping("/{id}/prep")
  public ApiResponse<PrepWithCandidatesRes> createPrep(
      @PathVariable("id") UUID appointmentId,
      @Valid @RequestBody CreatePrepReq req
  ) {
    return ApiResponse.ok(
        prepService.createPrepAndCandidates(appointmentId, req.travelMode(), req.originLat(), req.originLng())
    );
  }

  // 당일 공개(저장된 후보 조회)
  @GetMapping("/{id}/reveal")
  public ApiResponse<PrepWithCandidatesRes> reveal(@PathVariable("id") UUID appointmentId) {
    return ApiResponse.ok(prepService.reveal(appointmentId));
  }
}
