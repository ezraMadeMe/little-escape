package com.littleescape.api.service;

import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.type.LocationType;
import com.littleescape.api.domain.type.TimeOfDay;
import com.littleescape.api.repository.MissionTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MissionService {

    private final MissionTemplateRepository missionTemplateRepository;

    /**
     * 주어진 약속 시간에 맞는 미션 추천
     *
     * @param scheduledAt 약속 예정 시간
     * @return 추천 미션 리스트 (최대 4개)
     */
    public List<MissionTemplate> getRecommendations(
        @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")LocalDateTime scheduledAt
    ) {
        // 1. 시간대 분석
        List<TimeOfDay> targetTimes = analyzeTimeOfDay(scheduledAt);

        // 2. 날씨/장소 분석 (임시: 날씨 API 연동 전)
        List<LocationType> targetLocations = analyzeLocation();

        log.info("=== 미션 추천 로직 실행 === 요청 시간: {} 판단된 시간대: {} 장소 필터: {}",
                scheduledAt, targetTimes.get(0), targetLocations);

        // 3. 조건에 맞는 미션 조회
        List<MissionTemplate> candidates = missionTemplateRepository
                .findAllByTimeOfDayInAndLocationTypeIn(targetTimes, targetLocations);

        // 4. 랜덤 섞기
        Collections.shuffle(candidates);

        // 5. 최대 4개 선정
        return candidates.stream()
                .limit(4)
                .collect(Collectors.toList());
    }

    /**
     * 시간대 분석 로직
     *
     * @param scheduledAt 약속 예정 시간
     * @return 해당 시간대 + ANY를 포함한 리스트
     */
    private List<TimeOfDay> analyzeTimeOfDay(LocalDateTime scheduledAt) {
        int hour = scheduledAt.getHour();
        List<TimeOfDay> times = new ArrayList<>();

        // 시간대별 분류
        if (hour >= 6 && hour < 12) {
            times.add(TimeOfDay.MORNING);
        } else if (hour >= 12 && hour < 18) {
            times.add(TimeOfDay.AFTERNOON);
        } else {
            // 18~24시 또는 0~6시는 NIGHT
            times.add(TimeOfDay.NIGHT);
        }

        // ANY(무관)는 항상 포함
        times.add(TimeOfDay.ANY);

        return times;
    }

    /**
     * 날씨/장소 분석 로직
     * TODO: 날씨 API 연동 후 실제 날씨 데이터 활용
     *
     * @return 추천 가능한 장소 타입 리스트
     */
    private List<LocationType> analyzeLocation() {
        // 임시: 날씨 API 연동 전이므로 항상 맑음으로 가정
        boolean isRaining = false;

        List<LocationType> locations = new ArrayList<>();

        if (isRaining) {
            // 비/눈: 실내와 무관만 포함
            locations.add(LocationType.INDOOR);
            locations.add(LocationType.ANY);
        } else {
            // 맑음: 모든 장소 포함
            locations.add(LocationType.INDOOR);
            locations.add(LocationType.OUTDOOR);
            locations.add(LocationType.ANY);
        }

        return locations;
    }
}
