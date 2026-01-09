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
    public Appointment createAppointment(Long userId, LocalDateTime scheduledAt) {
        log.info("=== 약속 생성 시작 ===");
        log.info("사용자 ID: {}, 약속 시간: {}", userId, scheduledAt);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Appointment appointment = new Appointment();
        appointment.setUser(user);
        appointment.setMissionTemplate(null);  // 미션은 나중에 선택
        appointment.setPlace(null);  // 장소는 미션 선택 시 매칭
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setScheduledAt(scheduledAt);

        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("=== 약속 생성 완료 (ID: {}) ===", savedAppointment.getId());

        return savedAppointment;
    }

    @Transactional
    public void updateAppointmentMission(Long userId, Long appointmentId, Long missionId) {
        log.info("=== 약속 미션 업데이트 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}, 미션 ID: {}", userId, appointmentId, missionId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("본인의 약속만 수정할 수 있습니다.");
        }

        MissionTemplate missionTemplate = missionTemplateRepository.findById(missionId)
                .orElseThrow(() -> new RuntimeException("미션을 찾을 수 없습니다."));

        log.info("미션 카테고리: {}", missionTemplate.getCategory());

        // 미션 설정
        appointment.setMissionTemplate(missionTemplate);

        // 랜덤 장소 매칭 로직
        log.info("카테고리 {}에 해당하는 장소 조회 중...", missionTemplate.getCategory());
        List<Place> places = placeRepository.findByCategory(missionTemplate.getCategory());
        log.info("조회된 장소 개수: {}개", places.size());

        if (!places.isEmpty()) {
            Collections.shuffle(places);
            Place randomPlace = places.get(0);
            appointment.setPlace(randomPlace);
            log.info("선택된 장소: {}", randomPlace.getName());
        } else {
            log.warn("장소 매칭 실패! 카테고리: {}", missionTemplate.getCategory());
        }

        log.info("=== 약속 미션 업데이트 완료 (ID: {}) ===", appointmentId);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getMyAppointments(Long userId) {
        List<Appointment> appointments = appointmentRepository.findAllByUserIdOrderByScheduledAtDesc(userId);

        System.out.println("====== [내 약속 조회 디버깅] ======");
        System.out.println("조회된 약속 개수: " + appointments.size());

        return appointments.stream()
                .map(appointment -> {
                    // 장소 정보 강제 로딩 및 로그 출력
                    Place place = appointment.getPlace();
                    MissionTemplate mission = appointment.getMissionTemplate();
                    String placeName = (place != null) ? place.getName() : "장소 없음(Null)";
                    String missionTitle = (mission != null) ? mission.getTitle() : "미션 미선택";
                    System.out.println("약속 ID: " + appointment.getId() + ", 미션: " + missionTitle + ", 장소: " + placeName);

                    return new AppointmentResponse(
                        appointment.getId(),
                        (mission != null) ? mission.getTitle() : null,
                        appointment.getStatus(),
                        appointment.getScheduledAt(),
                        appointment.getCreatedAt(),
                        // 장소 정보 직접 매핑
                        (place != null) ? place.getName() : null,
                        (place != null) ? place.getAddress() : null,
                        (place != null) ? place.getUrl() : null,
                        (place != null) ? place.getLatitude() : null,
                        (place != null) ? place.getLongitude() : null,
                        // 이미지 URL 매핑
                        (mission != null) ? mission.getImageUrl() : null,
                        (place != null) ? place.getImageUrl() : null,
                        // 완료 인증 정보
                        appointment.getProofComment()
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelAppointment(Long userId, Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("본인의 약속만 취소할 수 있습니다.");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
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

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setProofComment(comment);
        appointment.setProofImageUrl(null);

        log.info("=== 약속 완료 처리 완료 (ID: {}) ===", appointmentId);
    }
}
