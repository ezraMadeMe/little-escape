package com.littleescape.api.controller;

import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.repository.MissionTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/missions")
@RequiredArgsConstructor
public class MissionTemplateController {

    private final MissionTemplateRepository missionTemplateRepository;

    @GetMapping
    public ResponseEntity<List<MissionTemplate>> getAllMissions() {
        List<MissionTemplate> missions = missionTemplateRepository.findAll();
        return ResponseEntity.ok(missions);
    }
}
