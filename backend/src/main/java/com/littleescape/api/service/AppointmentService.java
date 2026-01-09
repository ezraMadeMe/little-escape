package com.littleescape.api.service;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.User;
import com.littleescape.api.domain.type.AppointmentStatus;
import com.littleescape.api.dto.AppointmentResponse;
import com.littleescape.api.repository.AppointmentRepository;
import com.littleescape.api.repository.MissionTemplateRepository;
import com.littleescape.api.repository.PlaceRepository;
import com.littleescape.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final MissionTemplateRepository missionTemplateRepository;
    private final PlaceRepository placeRepository;

    @Transactional
    public Appointment createAppointment(Long userId, LocalDateTime scheduledAt, Long missionId) {
        log.info("=== 약속 생성 시작 ===");
        log.info("사용자 ID: {}, 약속 시간: {}, 미션 ID: {}", userId, scheduledAt, missionId);

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

        // missionId가 있으면 미션과 장소를 함께 설정
        if (missionId != null) {
            log.info("미션 ID가 제공됨 - 미션 및 장소 매칭 시작");
            MissionTemplate missionTemplate = missionTemplateRepository.findById(missionId)
                    .orElseThrow(() -> new IllegalArgumentException("미션을 찾을 수 없습니다."));

            appointment.updateMission(missionTemplate);
            log.info("미션 카테고리: {}", missionTemplate.getCategory());

            // 랜덤 장소 매칭
            List<Place> places = placeRepository.findByCategory(missionTemplate.getCategory());
            log.info("조회된 장소 개수: {}개", places.size());

            if (!places.isEmpty()) {
                Collections.shuffle(places);
                Place randomPlace = places.get(0);
                appointment.updatePlace(randomPlace);
                log.info("선택된 장소: {}", randomPlace.getName());
            } else {
                log.warn("장소 매칭 실패! 카테고리: {}", missionTemplate.getCategory());
            }
        } else {
            log.info("미션 ID 없음 - 시간만 예약");
            appointment.setMissionTemplate(null);
            appointment.setPlace(null);
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("=== 약속 생성 완료 (ID: {}) ===", savedAppointment.getId());

        return savedAppointment;
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

        // 랜덤 장소 매칭 로직
        log.info("카테고리 {}에 해당하는 장소 조회 중...", missionTemplate.getCategory());
        List<Place> places = placeRepository.findByCategory(missionTemplate.getCategory());
        log.info("조회된 장소 개수: {}개", places.size());

        if (!places.isEmpty()) {
            Collections.shuffle(places);
            Place randomPlace = places.get(0);
            appointment.updatePlace(randomPlace);
            log.info("선택된 장소: {}", randomPlace.getName());
        } else {
            log.warn("장소 매칭 실패! 카테고리: {}", missionTemplate.getCategory());
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

        return new AppointmentResponse(
            appointment.getId(),
            (mission != null) ? mission.getTitle() : null,
            appointment.getStatus(),
            appointment.getScheduledAt(),
            appointment.getCreatedAt(),
            (place != null) ? place.getName() : null,
            (place != null) ? place.getAddress() : null,
            (place != null) ? place.getUrl() : null,
            (place != null) ? place.getLatitude() : null,
            (place != null) ? place.getLongitude() : null,
            (mission != null) ? mission.getImageUrl() : null,
            (place != null) ? place.getImageUrl() : null,
            appointment.getProofComment(),
            visitCount
        );
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getMyAppointments(Long userId) {
        log.info("=== 내 약속 조회 시작 ===");
        log.info("사용자 ID: {}", userId);

        // DB 레벨에서 예정일 기준 내림차순 정렬하여 조회
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

                        // visitCount 계산 (미션이 있는 경우만)
                        Long visitCount = 0L;
                        if (mission != null) {
                            visitCount = appointmentRepository.countByUserIdAndMissionTemplateId(
                                userId, mission.getId()
                            );
                        }

                        // AppointmentResponse 생성 (모든 필드 null-safe)
                        return new AppointmentResponse(
                            appointment.getId(),
                            (mission != null) ? mission.getTitle() : null,
                            appointment.getStatus(),
                            appointment.getScheduledAt(),
                            appointment.getCreatedAt(),
                            // 장소 정보 (null-safe)
                            (place != null) ? place.getName() : null,
                            (place != null) ? place.getAddress() : null,
                            (place != null) ? place.getUrl() : null,
                            (place != null) ? place.getLatitude() : null,
                            (place != null) ? place.getLongitude() : null,
                            // 이미지 URL (null-safe)
                            (mission != null) ? mission.getImageUrl() : null,
                            (place != null) ? place.getImageUrl() : null,
                            // 완료 인증 정보
                            appointment.getProofComment(),
                            // 방문 횟수
                            visitCount
                        );
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
                            0L // visitCount
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
    public void completeAppointment(Long userId, Long appointmentId, String comment) {
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

        // null-safe 로깅
        MissionTemplate mission = appointment.getMissionTemplate();
        Place place = appointment.getPlace();
        String missionTitle = mission.getTitle();
        String placeName = (place != null) ? place.getName() : "장소 미정";

        log.info("완료할 약속 정보 - 미션: {}, 장소: {}", missionTitle, placeName);

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setProofComment(comment);
        appointment.setProofImageUrl(null);

        log.info("=== 약속 완료 처리 완료 (ID: {}) ===", appointmentId);
    }
}
