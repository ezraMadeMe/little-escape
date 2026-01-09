package com.littleescape.api.controller;

import com.littleescape.api.dto.MissionTemplateResponse;
import com.littleescape.api.repository.MissionTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/missions")
@RequiredArgsConstructor
public class MissionTemplateController {

    private final MissionTemplateRepository missionTemplateRepository;

    @GetMapping
    public ResponseEntity<List<MissionTemplateResponse>> getAllMissions() {
        List<MissionTemplateResponse> missions = missionTemplateRepository.findAll()
                .stream()
                .map(MissionTemplateResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(missions);
    }
}
