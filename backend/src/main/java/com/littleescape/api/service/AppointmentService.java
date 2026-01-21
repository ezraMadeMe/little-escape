package com.littleescape.api.service;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.User;
import com.littleescape.api.domain.type.AppointmentStatus;
import com.littleescape.api.domain.type.LocationType;
import com.littleescape.api.domain.type.TimeOfDay;
import com.littleescape.api.dto.AppointmentResponse;
import com.littleescape.api.dto.FeedResponse;
import com.littleescape.api.repository.AppointmentRepository;
import com.littleescape.api.repository.MissionTemplateRepository;
import com.littleescape.api.repository.PlaceRepository;
import com.littleescape.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final MissionTemplateRepository missionTemplateRepository;
    private final PlaceRepository placeRepository;

    // 1인 가구 타겟에 맞지 않는 키워드
    private static final String[] BAD_KEYWORDS = {
        "어린이", "유아", "강좌", "교실", "모집", "시니어", "동호회"
    };

    /**
     * 태그 충돌 검증 메서드
     * 사용자 태그와 미션/장소 태그를 비교하여 충돌 여부 반환
     *
     * @param userTags 사용자 태그 (쉼표로 구분된 문자열, 예: "NO_ALCOHOL,HATE_WALKING")
     * @param targetTags 미션/장소 태그 (쉼표로 구분된 문자열, 예: "ALCOHOL_ONLY,HIGH_ACTIVITY")
     * @return true면 충돌 (추천 제외), false면 충돌 없음 (추천 가능)
     */
    private boolean hasTagConflict(String userTags, String targetTags) {
        if (userTags == null || userTags.trim().isEmpty()
            || targetTags == null || targetTags.trim().isEmpty()) {
            return false; // 태그가 없으면 충돌 없음
        }

        Set<String> userTagSet = Arrays.stream(userTags.split(","))
                .map(String::trim)
                .collect(Collectors.toSet());

        Set<String> targetTagSet = Arrays.stream(targetTags.split(","))
                .map(String::trim)
                .collect(Collectors.toSet());

        // 충돌 규칙 정의
        // 1. 유저가 NO_ALCOHOL && 장소/미션이 ALCOHOL_ONLY -> 충돌
        if (userTagSet.contains("NO_ALCOHOL") && targetTagSet.contains("ALCOHOL_ONLY")) {
            log.info("🚫 태그 충돌 감지: 사용자는 NO_ALCOHOL, 대상은 ALCOHOL_ONLY");
            return true;
        }

        // 2. 유저가 HATE_WALKING && 미션이 HIGH_ACTIVITY -> 충돌
        if (userTagSet.contains("HATE_WALKING") && targetTagSet.contains("HIGH_ACTIVITY")) {
            log.info("🚫 태그 충돌 감지: 사용자는 HATE_WALKING, 대상은 HIGH_ACTIVITY");
            return true;
        }

        // 3. 유저가 NO_SPORTS && 미션이 SPORTS_REQUIRED -> 충돌
        if (userTagSet.contains("NO_SPORTS") && targetTagSet.contains("SPORTS_REQUIRED")) {
            log.info("🚫 태그 충돌 감지: 사용자는 NO_SPORTS, 대상은 SPORTS_REQUIRED");
            return true;
        }

        // 4. 유저가 INDOOR_ONLY && 미션이 OUTDOOR_REQUIRED -> 충돌
        if (userTagSet.contains("INDOOR_ONLY") && targetTagSet.contains("OUTDOOR_REQUIRED")) {
            log.info("🚫 태그 충돌 감지: 사용자는 INDOOR_ONLY, 대상은 OUTDOOR_REQUIRED");
            return true;
        }

        return false; // 충돌 없음
    }

    @Transactional
    public Appointment createAppointment(Long userId, LocalDateTime scheduledAt, Long missionId,
                                        Double userLatitude, Double userLongitude) {
        log.info("=== 약속 생성 시작 ===");
        log.info("사용자 ID: {}, 약속 시간: {}, 미션 ID: {}", userId, scheduledAt, missionId);
        log.info("사용자 위치: 위도 {}, 경도 {}", userLatitude, userLongitude);

        // 진행 중인 약속이 있는지 검증
        List<AppointmentStatus> activeStatuses = List.of(AppointmentStatus.PENDING, AppointmentStatus.ACCEPTED);
        boolean hasActiveAppointment = appointmentRepository.existsByUserIdAndStatusIn(userId, activeStatuses);

        if (hasActiveAppointment) {
            log.warn("이미 진행 중인 약속이 존재함 - 사용자 ID: {}", userId);
            throw new IllegalStateException("이미 진행 중인 약속이 있습니다. 기존 약속을 완료하거나 취소해주세요.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Appointment appointment = new Appointment();
        appointment.setUser(user);
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setScheduledAt(scheduledAt);

        // 미션 자동 배정 로직
        MissionTemplate selectedMission;
        
        if (missionId != null) {
            // 1. 미션 ID가 명시된 경우 (기존 로직 유지)
            log.info("미션 ID가 제공됨 - 미션 및 장소 매칭 시작");
            selectedMission = missionTemplateRepository.findById(missionId)
                    .orElseThrow(() -> new IllegalArgumentException("미션을 찾을 수 없습니다."));
        } else {
            // 2. 미션 ID가 없는 경우 - 자동 랜덤 배정 (핵심 로직)
            log.info("미션 ID 없음 - 시간/날씨에 맞는 미션 자동 선정 시작");
            
            // 2-1. 시간대 분석
            List<TimeOfDay> targetTimes = analyzeTimeOfDay(scheduledAt);
            log.info("분석된 시간대: {}", targetTimes);
            
            // 2-2. 날씨/장소 분석 (추후 날씨 API 연동)
            List<LocationType> targetLocations = analyzeLocation();
            log.info("추천 장소 타입: {}", targetLocations);
            
            // 2-3. 조건에 맞는 미션 후보 조회
            List<MissionTemplate> candidates = missionTemplateRepository
                    .findAllByTimeOfDayInAndLocationTypeIn(targetTimes, targetLocations);

            log.info("조건에 맞는 미션 후보: {}개", candidates.size());

            // 2-3-1. 사용자 태그 기반 필터링 (태그 충돌 제외)
            String userTags = user.getTags();
            if (userTags != null && !userTags.trim().isEmpty()) {
                log.info("🏷️ 사용자 태그 필터링 적용: {}", userTags);
                List<MissionTemplate> filteredCandidates = candidates.stream()
                        .filter(mission -> !hasTagConflict(userTags, mission.getTags()))
                        .collect(Collectors.toList());

                log.info("태그 필터링 후 미션 후보: {}개 (제외된 미션: {}개)",
                        filteredCandidates.size(),
                        candidates.size() - filteredCandidates.size());

                // 필터링 후에도 후보가 있으면 사용
                if (!filteredCandidates.isEmpty()) {
                    candidates = filteredCandidates;
                } else {
                    log.warn("⚠️ 태그 필터링 후 미션 후보가 0개 - 필터링 무시하고 진행");
                }
            }

            if (candidates.isEmpty()) {
                throw new IllegalStateException(
                    "약속 시간에 맞는 미션을 찾을 수 없습니다. 관리자에게 문의해주세요."
                );
            }

            // 2-4. 랜덤으로 하나 선정
            Collections.shuffle(candidates);
            selectedMission = candidates.get(0);
            
            log.info("자동 선정된 미션: {} (ID: {})", selectedMission.getTitle(), selectedMission.getId());
        }

        // 3. 선정된 미션을 Appointment에 연결
        appointment.updateMission(selectedMission);
        log.info("미션 연결 완료 - 카테고리: {}, 장소 필수: {}", 
                selectedMission.getCategory(), 
                selectedMission.getIsPlaceRequired());

        // 4. 장소 조건부 매칭 (개선된 로직: 거리 제한 포함)
        if (selectedMission.getIsPlaceRequired() != null && selectedMission.getIsPlaceRequired()) {
            // 4-1. 장소가 필요한 미션 -> 필터링된 양질의 장소 자동 매칭 (반경 10km 이내)
            log.info("🏠 장소가 필요한 미션 - 필터링된 장소 자동 매칭 시작 (반경 10km 이내)");

            Place matchedPlace = findQualityPlaceNearby(user, selectedMission.getCategory(), userLatitude, userLongitude);

            if (matchedPlace != null) {
                appointment.updatePlace(matchedPlace);
                log.info("✅ 선택된 장소: {} (카테고리: {})", matchedPlace.getName(), matchedPlace.getCategory());
            } else {
                log.error("❌ 장소 매칭 실패! 카테고리: {} - 반경 10km 내 필터링 후 적합한 장소가 없음", selectedMission.getCategory());
                throw new IllegalStateException(
                    "이 미션은 장소가 필요하지만 주변 10km 이내에서 적절한 장소를 찾을 수 없습니다. 다른 지역을 시도해주세요."
                );
            }
        } else {
            // 4-2. 장소가 필요 없는 미션 -> 장소 없이 진행
            log.info("🌍 장소가 필요 없는 미션 - 어디서든 수행 가능");
            appointment.setPlace(null);
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("=== 약속 생성 완료 (ID: {}) ===", savedAppointment.getId());
        log.info("📋 미션: {} (ID: {})", selectedMission.getTitle(), selectedMission.getId());
        log.info("📍 장소: {}", savedAppointment.getPlace() != null ? savedAppointment.getPlace().getName() : "없음 (어디서든 가능)");
        log.info("🏷️ 상태: {}", savedAppointment.getStatus());

        // 약속 생성 후 매직 토큰 만료 처리
        if (user.getMagicToken() != null) {
            log.info("매직 토큰 만료 처리 - User: {} ({})", user.getNickname(), user.getEmail());
            user.setMagicToken(null);
            user.setMagicTokenExpiry(null);
            userRepository.save(user);
        }

        return savedAppointment;
    }

    /**
     * 필터링된 양질의 장소 찾기 (거리 제한 포함 + 태그 필터링)
     * @param user 사용자 객체 (태그 필터링용)
     * @param missionCategory 미션 카테고리
     * @param userLatitude 사용자 위도
     * @param userLongitude 사용자 경도
     * @return 매칭된 장소 (없으면 null)
     */
    private Place findQualityPlaceNearby(User user,
                                         com.littleescape.api.domain.type.MissionCategory missionCategory,
                                         Double userLatitude, Double userLongitude) {
        log.info("=== 필터링된 양질의 장소 검색 시작 (반경 10km 이내) ===");
        log.info("미션 카테고리: {}, 사용자 위치: ({}, {})", missionCategory, userLatitude, userLongitude);

        // 1단계: 미션 카테고리에 매칭되는 장소 카테고리 목록 가져오기
        List<com.littleescape.api.domain.type.MissionCategory> targetCategories =
            getCategoryMapping(missionCategory);

        log.info("매칭 시도 카테고리 목록: {}", targetCategories);

        // 2단계: 각 카테고리별로 필터링된 장소 검색 (거리 제한 포함)
        List<Place> allFilteredPlaces = new ArrayList<>();

        for (com.littleescape.api.domain.type.MissionCategory targetCategory : targetCategories) {
            List<Place> filteredPlaces = placeRepository.findByCategoryFilteredWithDistance(
                targetCategory,
                userLatitude, userLongitude,
                BAD_KEYWORDS[0], BAD_KEYWORDS[1], BAD_KEYWORDS[2], BAD_KEYWORDS[3],
                BAD_KEYWORDS[4], BAD_KEYWORDS[5], BAD_KEYWORDS[6]
            );
            log.info("카테고리 {} - 반경 10km 내 필터링된 장소: {}개", targetCategory, filteredPlaces.size());
            allFilteredPlaces.addAll(filteredPlaces);
        }

        log.info("총 필터링된 장소 개수 (반경 10km 이내): {}개", allFilteredPlaces.size());

        // 3단계: 매칭된 장소가 없으면 Fallback (카테고리 무관, 거리+필터링만 유지)
        if (allFilteredPlaces.isEmpty()) {
            log.warn("카테고리 매칭된 장소 없음 - Fallback으로 전체 필터링된 장소 검색 (반경 10km 이내)");
            allFilteredPlaces = placeRepository.findAllFilteredWithDistance(
                userLatitude, userLongitude,
                BAD_KEYWORDS[0], BAD_KEYWORDS[1], BAD_KEYWORDS[2], BAD_KEYWORDS[3],
                BAD_KEYWORDS[4], BAD_KEYWORDS[5], BAD_KEYWORDS[6]
            );
            log.info("Fallback - 반경 10km 내 전체 필터링된 장소: {}개", allFilteredPlaces.size());
        }

        // 4단계: 사용자 태그 기반 장소 필터링
        String userTags = user.getTags();
        if (userTags != null && !userTags.trim().isEmpty()) {
            log.info("🏷️ 사용자 태그 기반 장소 필터링 적용: {}", userTags);
            List<Place> tagFilteredPlaces = allFilteredPlaces.stream()
                    .filter(place -> !hasTagConflict(userTags, place.getTags()))
                    .collect(Collectors.toList());

            log.info("태그 필터링 후 장소 후보: {}개 (제외된 장소: {}개)",
                    tagFilteredPlaces.size(),
                    allFilteredPlaces.size() - tagFilteredPlaces.size());

            // 필터링 후에도 후보가 있으면 사용
            if (!tagFilteredPlaces.isEmpty()) {
                allFilteredPlaces = tagFilteredPlaces;
            } else {
                log.warn("⚠️ 태그 필터링 후 장소 후보가 0개 - 필터링 무시하고 진행");
            }
        }

        // 5단계: 랜덤 선택
        if (!allFilteredPlaces.isEmpty()) {
            Collections.shuffle(allFilteredPlaces);
            Place selectedPlace = allFilteredPlaces.get(0);
            log.info("=== 최종 선택된 장소: {} (카테고리: {}) ===", selectedPlace.getName(), selectedPlace.getCategory());
            return selectedPlace;
        }

        log.error("=== 반경 10km 내 필터링 후에도 적합한 장소를 찾을 수 없음 ===");
        return null;
    }

    /**
     * 필터링된 양질의 장소 찾기 (거리 제한 없음 - 레거시)
     * updateAppointmentMission에서 사용 (사용자 위치 정보가 없는 경우)
     * @param missionCategory 미션 카테고리
     * @return 매칭된 장소 (없으면 null)
     */
    private Place findQualityPlace(com.littleescape.api.domain.type.MissionCategory missionCategory) {
        log.info("=== 필터링된 양질의 장소 검색 시작 (거리 제한 없음) ===");
        log.info("미션 카테고리: {}", missionCategory);

        // 1단계: 미션 카테고리에 매칭되는 장소 카테고리 목록 가져오기
        List<com.littleescape.api.domain.type.MissionCategory> targetCategories =
            getCategoryMapping(missionCategory);

        log.info("매칭 시도 카테고리 목록: {}", targetCategories);

        // 2단계: 각 카테고리별로 필터링된 장소 검색
        List<Place> allFilteredPlaces = new ArrayList<>();

        for (com.littleescape.api.domain.type.MissionCategory targetCategory : targetCategories) {
            List<Place> filteredPlaces = placeRepository.findByCategoryFiltered(
                targetCategory,
                BAD_KEYWORDS[0], BAD_KEYWORDS[1], BAD_KEYWORDS[2], BAD_KEYWORDS[3],
                BAD_KEYWORDS[4], BAD_KEYWORDS[5], BAD_KEYWORDS[6]
            );
            log.info("카테고리 {} - 필터링된 장소: {}개", targetCategory, filteredPlaces.size());
            allFilteredPlaces.addAll(filteredPlaces);
        }

        log.info("총 필터링된 장소 개수: {}개", allFilteredPlaces.size());

        // 3단계: 매칭된 장소가 없으면 Fallback (카테고리 무관, 필터링만 유지)
        if (allFilteredPlaces.isEmpty()) {
            log.warn("카테고리 매칭된 장소 없음 - Fallback으로 전체 필터링된 장소 검색");
            allFilteredPlaces = placeRepository.findAllFiltered(
                BAD_KEYWORDS[0], BAD_KEYWORDS[1], BAD_KEYWORDS[2], BAD_KEYWORDS[3],
                BAD_KEYWORDS[4], BAD_KEYWORDS[5], BAD_KEYWORDS[6]
            );
            log.info("Fallback - 전체 필터링된 장소: {}개", allFilteredPlaces.size());
        }

        // 4단계: 랜덤 선택
        if (!allFilteredPlaces.isEmpty()) {
            Collections.shuffle(allFilteredPlaces);
            Place selectedPlace = allFilteredPlaces.get(0);
            log.info("=== 최종 선택된 장소: {} (카테고리: {}) ===", selectedPlace.getName(), selectedPlace.getCategory());
            return selectedPlace;
        }

        log.error("=== 필터링 후에도 적합한 장소를 찾을 수 없음 ===");
        return null;
    }

    /**
     * 미션 카테고리에 따른 장소 카테고리 매핑 전략
     * @param missionCategory 미션 카테고리
     * @return 매칭 가능한 장소 카테고리 목록
     */
    private List<com.littleescape.api.domain.type.MissionCategory> getCategoryMapping(
        com.littleescape.api.domain.type.MissionCategory missionCategory) {

        List<com.littleescape.api.domain.type.MissionCategory> mapping = new ArrayList<>();

        switch (missionCategory) {
            case ACTIVITY:
                // 활동(산책, 운동 등) -> ACTIVITY 우선, 부가적으로 RELAX, CULTURE
                mapping.add(com.littleescape.api.domain.type.MissionCategory.ACTIVITY);
                mapping.add(com.littleescape.api.domain.type.MissionCategory.RELAX);
                mapping.add(com.littleescape.api.domain.type.MissionCategory.CULTURE);
                break;

            case CULTURE:
                // 문화(전시/관람) -> CULTURE 우선, 부가적으로 RELAX
                mapping.add(com.littleescape.api.domain.type.MissionCategory.CULTURE);
                mapping.add(com.littleescape.api.domain.type.MissionCategory.RELAX);
                break;

            case RELAX:
                // 휴식(카페, 도서관) -> RELAX 우선, 부가적으로 CULTURE
                mapping.add(com.littleescape.api.domain.type.MissionCategory.RELAX);
                mapping.add(com.littleescape.api.domain.type.MissionCategory.CULTURE);
                break;

            case FOOD:
                // 음식 -> FOOD 우선, 부가적으로 RELAX
                mapping.add(com.littleescape.api.domain.type.MissionCategory.FOOD);
                mapping.add(com.littleescape.api.domain.type.MissionCategory.RELAX);
                break;

            default:
                // 기본값: 미션 카테고리 그대로
                mapping.add(missionCategory);
                break;
        }

        return mapping;
    }

    /**
     * 시간대 분석 로직
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

    @Transactional
    public Long updateAppointmentMission(Long userId, Long appointmentId, Long missionId) {
        log.info("=== 약속 미션 업데이트 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}, 미션 ID: {}", userId, appointmentId, missionId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("약속이 존재하지 않습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 약속만 수정할 수 있습니다.");
        }

        MissionTemplate missionTemplate = missionTemplateRepository.findById(missionId)
                .orElseThrow(() -> new IllegalArgumentException("미션을 찾을 수 없습니다."));

        log.info("미션 카테고리: {}", missionTemplate.getCategory());

        // 미션 설정
        appointment.updateMission(missionTemplate);

        // 필터링된 양질의 장소 매칭 로직
        log.info("카테고리 {}에 해당하는 필터링된 장소 조회 중...", missionTemplate.getCategory());

        Place matchedPlace = findQualityPlace(missionTemplate.getCategory());

        if (matchedPlace != null) {
            appointment.updatePlace(matchedPlace);
            log.info("선택된 장소: {} (카테고리: {})", matchedPlace.getName(), matchedPlace.getCategory());
        } else {
            log.warn("장소 매칭 실패! 카테고리: {} - 필터링 후 적합한 장소가 없음", missionTemplate.getCategory());
        }

        log.info("=== 약속 미션 업데이트 완료 (ID: {}) ===", appointmentId);
        return appointment.getId();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentDetail(Long userId, Long appointmentId) {
        log.info("=== 약속 상세 조회 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}", userId, appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 약속만 조회할 수 있습니다.");
        }

        // visitCount 계산
        Long visitCount = 0L;
        MissionTemplate mission = appointment.getMissionTemplate();
        if (mission != null) {
            visitCount = appointmentRepository.countByUserIdAndMissionTemplateId(
                userId, mission.getId()
            );
        }

        Place place = appointment.getPlace();

        log.info("=== 약속 상세 조회 완료 (ID: {}) ===", appointmentId);

        return AppointmentResponse.from(appointment, visitCount);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getMyAppointments(Long userId) {
        log.info("=== 내 약속 조회 시작 ===");
        log.info("사용자 ID: {}", userId);

        // DB 레벨에서 예정일 기준 내림차순 정렬하여 조회 (수정 요청 반영)
        List<Appointment> appointments = appointmentRepository.findAllByUserIdOrderByScheduledAtDesc(userId);
        log.info("조회된 약속 개수: {}", appointments.size());

        return appointments.stream()
                .map(appointment -> {
                    try {
                        // 안전한 null 처리로 장소 및 미션 정보 로딩
                        Place place = appointment.getPlace();
                        MissionTemplate mission = appointment.getMissionTemplate();

                        // 로그 출력 (null-safe)
                        String placeName = (place != null) ? place.getName() : "장소 미정";
                        String missionTitle = (mission != null) ? mission.getTitle() : "미션 미선택";
                        log.debug("약속 ID: {}, 미션: {}, 장소: {}",
                            appointment.getId(), missionTitle, placeName);

                        // visitCount 계산 (미션이 있는 경우만) - 정렬 순서에 영향 없음
                        Long visitCount = 0L;
                        if (mission != null) {
                            visitCount = appointmentRepository.countByUserIdAndMissionTemplateId(
                                userId, mission.getId()
                            );
                        }

                        // AppointmentResponse 생성 (모든 필드 null-safe)
                        return AppointmentResponse.from(appointment, visitCount);
                    } catch (Exception e) {
                        log.error("약속 정보 변환 중 오류 발생 (약속 ID: {}): {}",
                            appointment.getId(), e.getMessage(), e);
                        // 오류 발생 시에도 기본 정보는 반환
                        return new AppointmentResponse(
                            appointment.getId(),
                            null, // missionTitle
                            appointment.getStatus(),
                            appointment.getScheduledAt(),
                            appointment.getCreatedAt(),
                            null, null, null, null, null, // place info
                            null, null, // images
                            appointment.getProofComment(),
                            null, // proofImageUrl
                            null, 
                            null, 
                            0L, // visitCount
                            appointment.isFavorite(),
                            null
                        );
                    }
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelAppointment(Long userId, Long appointmentId) {
        log.info("=== 약속 취소 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}", userId, appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("약속이 존재하지 않습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 약속만 취소할 수 있습니다.");
        }

        // 미션이 있든 없든 상태만 변경 (NPE 방지)
        appointment.cancel();

        log.info("=== 약속 취소 완료 (ID: {}) ===", appointmentId);
    }

    @Transactional
    public void completeAppointment(Long userId, Long appointmentId,
                                    java.util.List<org.springframework.web.multipart.MultipartFile> files,
                                    com.littleescape.api.dto.AppointmentCompleteRequest request) {
        log.info("=== 약속 완료 처리 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}", userId, appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("본인의 약속만 완료 처리할 수 있습니다.");
        }

        // 미션이 선택되지 않은 약속은 완료할 수 없음
        if (appointment.getMissionTemplate() == null) {
            throw new RuntimeException("미션을 먼저 선택해주세요.");
        }

        // 이미지 파일 처리 - 로컬 uploads/ 폴더에 저장
        java.util.List<String> imageUrls = new java.util.ArrayList<>();
        if (files != null && !files.isEmpty()) {
            log.info("업로드된 파일 개수: {}", files.size());

            // 1. 저장할 기본 경로 설정 (프로젝트 루트/uploads)
            String projectPath = System.getProperty("user.dir");
            String uploadDirPath = projectPath + java.io.File.separator + "uploads";
            java.io.File directory = new java.io.File(uploadDirPath);

            log.info("프로젝트 경로: {}", projectPath);
            log.info("업로드 디렉토리 경로: {}", uploadDirPath);

            // 2. ⭐ 핵심: 폴더가 없으면 생성
            if (!directory.exists()) {
                boolean created = directory.mkdirs();
                if (!created) {
                    log.error("디렉토리 생성 실패: {}", uploadDirPath);
                    throw new RuntimeException("파일 저장 디렉토리 생성에 실패했습니다.");
                }
                log.info("uploads 디렉토리 생성 완료: {}", directory.getAbsolutePath());
            } else {
                log.info("uploads 디렉토리 이미 존재함: {}", directory.getAbsolutePath());
            }

            // 3. 각 파일 저장
            for (org.springframework.web.multipart.MultipartFile file : files) {
                if (file.isEmpty()) {
                    log.warn("빈 파일 건너뜀");
                    continue;
                }

                try {
                    // 원본 파일명 및 확장자 추출
                    String originalFilename = file.getOriginalFilename();
                    String extension = (originalFilename != null && originalFilename.contains("."))
                            ? originalFilename.substring(originalFilename.lastIndexOf("."))
                            : ".jpg";

                    // UUID로 고유 파일명 생성
                    String savedFileName = java.util.UUID.randomUUID().toString() + extension;
                    java.io.File dest = new java.io.File(directory, savedFileName);

                    log.info("파일 저장 시도: {} -> {}", originalFilename, dest.getAbsolutePath());

                    // 4. 파일 저장
                    file.transferTo(dest);

                    // 5. DB에 저장할 접근 URL 생성 (예: /uploads/uuid.jpg)
                    // (WebConfig에서 /uploads/** 경로를 이 폴더로 매핑해줘야 함)
                    String fileUrl = "/uploads/" + savedFileName;
                    imageUrls.add(fileUrl);

                    log.info("파일 저장 완료: {} -> {}", originalFilename, fileUrl);
                } catch (java.io.IOException e) {
                    log.error("파일 저장 중 오류 발생: {}", file.getOriginalFilename(), e);
                    throw new RuntimeException("파일 저장에 실패했습니다: " + file.getOriginalFilename(), e);
                }
            }

            log.info("총 {}개 파일 저장 완료", imageUrls.size());
        }

        // null-safe 로깅
        MissionTemplate mission = appointment.getMissionTemplate();
        Place place = appointment.getPlace();
        String missionTitle = mission.getTitle();
        String placeName = (place != null) ? place.getName() : "장소 미정";

        log.info("완료할 약속 정보 - 미션: {}, 장소: {}, 키워드: {}, 이미지 개수: {}",
                 missionTitle, placeName, request.reviewKeywords(), imageUrls.size());

        // 약속 완료 처리
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setCompletedAt(LocalDateTime.now());
        appointment.setProofComment(request.proofComment());

        // 다중 이미지 URL 저장
        appointment.getProofImageUrls().clear();
        appointment.getProofImageUrls().addAll(imageUrls);

        // 하위 호환성을 위해 첫 번째 이미지를 기존 필드에도 저장
        if (!imageUrls.isEmpty()) {
            appointment.setProofImageUrl(imageUrls.get(0));
        }

        // 키워드 저장
        appointment.getReviewKeywords().clear();
        appointment.getReviewKeywords().addAll(request.reviewKeywords());

        log.info("=== 약속 완료 처리 완료 (ID: {}) ===", appointmentId);
    }

    @Transactional
    public Appointment cloneAppointment(Long oldAppointmentId, User user) {
        log.info("=== 약속 복제 시작 ===");
        log.info("기존 약속 ID: {}, 사용자 ID: {}", oldAppointmentId, user.getId());

        // 기존 약속 조회
        Appointment oldAppointment = appointmentRepository.findById(oldAppointmentId)
                .orElseThrow(() -> new IllegalArgumentException("약속을 찾을 수 없습니다."));

        // 본인의 약속인지 확인
        if (!oldAppointment.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("본인의 약속만 복제할 수 있습니다.");
        }

        // 진행 중인 약속이 있는지 검증
        List<AppointmentStatus> activeStatuses = List.of(AppointmentStatus.PENDING, AppointmentStatus.ACCEPTED);
        boolean hasActiveAppointment = appointmentRepository.existsByUserIdAndStatusIn(user.getId(), activeStatuses);

        if (hasActiveAppointment) {
            log.warn("이미 진행 중인 약속이 존재함 - 사용자 ID: {}", user.getId());
            throw new IllegalStateException("이미 진행 중인 약속이 있습니다. 기존 약속을 완료하거나 취소해주세요.");
        }

        // 새로운 약속 생성
        Appointment newAppointment = new Appointment();
        newAppointment.setUser(user);
        newAppointment.setStatus(AppointmentStatus.PENDING);

        // 기존 약속의 미션, 장소, 시간 정보 복사
        if (oldAppointment.getMissionTemplate() != null) {
            newAppointment.updateMission(oldAppointment.getMissionTemplate());
        }
        if (oldAppointment.getPlace() != null) {
            newAppointment.updatePlace(oldAppointment.getPlace());
        }

        // scheduledAt은 기존 약속의 시간을 복사 (NOT NULL 제약조건)
        newAppointment.setScheduledAt(oldAppointment.getScheduledAt());

        // proofImageUrl, proofComment는 null로 초기화 (새로운 인증을 위해)
        newAppointment.setProofComment(null);
        newAppointment.setProofImageUrl(null);

        Appointment savedAppointment = appointmentRepository.save(newAppointment);
        log.info("=== 약속 복제 완료 (새 약속 ID: {}) ===", savedAppointment.getId());

        return savedAppointment;
    }

    @Transactional
    public void toggleFavorite(Long userId, Long appointmentId) {
        log.info("=== 즐겨찾기 토글 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}", userId, appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        appointment.toggleFavorite();
        appointmentRepository.save(appointment);

        log.info("=== 즐겨찾기 토글 완료 (현재 상태: {}) ===", appointment.isFavorite());
    }

    @Transactional
    public Appointment markAsArrived(Long userId, Long appointmentId) {
        log.info("=== 도착 인증 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}", userId, appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        // 상태를 ARRIVED로 변경
        appointment.setStatus(AppointmentStatus.ARRIVED);
        Appointment savedAppointment = appointmentRepository.save(appointment);

        log.info("=== 도착 인증 완료 (상태: {}) ===", savedAppointment.getStatus());
        return savedAppointment;
    }

    @Transactional
    public void bulkDeleteAppointments(Long userId, List<Long> appointmentIds) {
        log.info("=== 다중 약속 삭제 시작 ===");
        log.info("사용자 ID: {}, 삭제할 약속 개수: {}", userId, appointmentIds.size());

        List<Appointment> appointments = appointmentRepository.findAllById(appointmentIds);

        // 권한 확인
        for (Appointment appointment : appointments) {
            if (!appointment.getUser().getId().equals(userId)) {
                throw new RuntimeException("삭제 권한이 없는 약속이 포함되어 있습니다.");
            }
        }

        appointmentRepository.deleteAll(appointments);

        log.info("=== 다중 약속 삭제 완료 ({} 건) ===", appointments.size());
    }

    /**
     * 공개 피드 조회 (인증샷이 있는 완료된 약속만)
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     * @return 피드 리스트
     */
    @Transactional(readOnly = true)
    public List<FeedResponse> getPublicFeed(int page, int size) {
        log.info("=== 공개 피드 조회 시작 ===");
        log.info("페이지: {}, 사이즈: {}", page, size);

        Pageable pageable = PageRequest.of(page, size);

        List<Appointment> appointments = appointmentRepository
            .findAllByStatusAndIsPublicTrueOrderByCompletedAtDesc(
                AppointmentStatus.COMPLETED,
                pageable
            );

        log.info("조회된 공개 약속 개수: {}", appointments.size());

        // 인증샷(proofImageUrls)이 없는 데이터는 제외
        List<FeedResponse> feedResponses = appointments.stream()
            .filter(appointment ->
                appointment.getProofImageUrls() != null &&
                !appointment.getProofImageUrls().isEmpty()
            )
            .map(FeedResponse::from)
            .collect(Collectors.toList());

        log.info("인증샷이 있는 피드 개수: {}", feedResponses.size());
        log.info("=== 공개 피드 조회 완료 ===");

        return feedResponses;
    }

    // ========================================
    // 개발용 메서드 (테스트 전용)
    // ========================================

    /**
     * 개발용: 약속 날짜를 내일(D-1)로 변경
     * 미션 공개 알림 테스트용
     */
    @Transactional
    public Appointment unlockTomorrow(Long userId, Long appointmentId) {
        log.warn("⚠️ [개발용] 약속 날짜를 내일로 변경 시작");
        
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        // 내일 같은 시간으로 변경
        java.time.LocalDateTime tomorrow = java.time.LocalDateTime.now().plusDays(1);
        appointment.setScheduledAt(tomorrow);

        // 상태 변경: 미션이 있으면 ACCEPTED, 없으면 CREATED 유지 (DB 제약 조건 준수)
        if (appointment.getMissionTemplate() != null) {
            appointment.setStatus(com.littleescape.api.domain.type.AppointmentStatus.ACCEPTED);
            log.warn("  → 미션이 선택되어 있어 상태를 ACCEPTED로 변경");
        } else {
            // 미션이 없으면 CREATED 상태 유지 (UNLOCKED는 미션이 필요함)
            appointment.setStatus(com.littleescape.api.domain.type.AppointmentStatus.CREATED);
            log.warn("  → 미션이 없어 상태를 CREATED로 유지");
        }

        Appointment saved = appointmentRepository.save(appointment);
        
        log.warn("⚠️ [개발용] 약속 날짜 변경 완료: {} → {}, 상태: {}", appointmentId, tomorrow, saved.getStatus());
        
        return saved;
    }

    /**
     * 개발용: 약속 날짜를 현재 시간으로 변경
     * 인증/완료 기능 테스트용
     */
    @Transactional
    public Appointment unlockNow(Long userId, Long appointmentId) {
        log.warn("⚠️ [개발용] 약속 날짜를 현재 시간으로 변경 시작");
        
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        // 현재 시간으로 변경
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        appointment.setScheduledAt(now);

        // 상태 변경: 미션이 있으면 ACCEPTED, 없으면 CREATED 유지 (DB 제약 조건 준수)
        if (appointment.getMissionTemplate() != null) {
            appointment.setStatus(com.littleescape.api.domain.type.AppointmentStatus.ACCEPTED);
            log.warn("  → 미션이 선택되어 있어 상태를 ACCEPTED로 변경");
        } else {
            // 미션이 없으면 CREATED 상태 유지 (UNLOCKED는 미션이 필요함)
            appointment.setStatus(com.littleescape.api.domain.type.AppointmentStatus.CREATED);
            log.warn("  → 미션이 없어 상태를 CREATED로 유지");
        }

        Appointment saved = appointmentRepository.save(appointment);
        
        log.warn("⚠️ [개발용] 약속 날짜 변경 완료: {} → {}, 상태: {}", appointmentId, now, saved.getStatus());
        
        return saved;
    }
}