package com.littleescape.api.service;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.User;
import com.littleescape.api.domain.type.AppointmentStatus;
import com.littleescape.api.dto.AppointmentResponse;
import com.littleescape.api.repository.AppointmentRepository;
import com.littleescape.api.repository.MissionTemplateRepository;
import com.littleescape.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final MissionTemplateRepository missionTemplateRepository;

    @Transactional
    public Appointment createAppointment(Long userId, Long missionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        MissionTemplate missionTemplate = missionTemplateRepository.findById(missionId)
                .orElseThrow(() -> new RuntimeException("미션을 찾을 수 없습니다."));

        Appointment appointment = new Appointment();
        appointment.setUser(user);
        appointment.setMissionTemplate(missionTemplate);
        appointment.setStatus(AppointmentStatus.PENDING);

        // 현재 시간 기준 3일 뒤로 약속 시간 설정
        LocalDateTime scheduledAt = LocalDateTime.now().plusDays(3);
        appointment.setScheduledAt(scheduledAt);

        return appointmentRepository.save(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getMyAppointments(Long userId) {
        List<Appointment> appointments = appointmentRepository.findAllByUserIdOrderByScheduledAtDesc(userId);
        return appointments.stream()
                .map(AppointmentResponse::from)
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
}
