package com.littleescape.api.controller;

import com.littleescape.api.dto.MissionTemplateResponse;
import com.littleescape.api.repository.MissionTemplateRepository;
import com.littleescape.api.service.MissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/missions")
@RequiredArgsConstructor
public class MissionTemplateController {

    private final MissionTemplateRepository missionTemplateRepository;
    private final MissionService missionService;

    @GetMapping
    public ResponseEntity<List<MissionTemplateResponse>> getAllMissions() {
        List<MissionTemplateResponse> missions = missionTemplateRepository.findAll()
                .stream()
                .map(MissionTemplateResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(missions);
    }

    @GetMapping("/recommend")
    public ResponseEntity<List<MissionTemplateResponse>> getRecommendedMissions(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime scheduledAt
    ) {
        List<MissionTemplateResponse> recommendations = missionService.getRecommendations(scheduledAt)
                .stream()
                .map(MissionTemplateResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(recommendations);
    }
}
