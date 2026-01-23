package com.littleescape.api.repository;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.type.AppointmentStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUserId(Long userId);
    
    // 사용자의 약속을 예정일 기준 내림차순으로 조회 (DB 정렬)
    List<Appointment> findAllByUserIdOrderByScheduledAtDesc(Long userId);
    
    Long countByUserIdAndMissionTemplateId(Long userId, Long missionTemplateId);
    boolean existsByUserIdAndStatusIn(Long userId, List<AppointmentStatus> statuses);

    // 특정 시간 범위 사이에 있는 약속 조회
    List<Appointment> findAllByScheduledAtBetween(LocalDateTime start, LocalDateTime end);

    List<Appointment> findAllByStatusAndScheduledAtBetween(
        AppointmentStatus status,
        LocalDateTime start,
        LocalDateTime end
    );

    // UUID 토큰으로 조회
    java.util.Optional<Appointment> findByUnlockToken(String unlockToken);

    void deleteByUserId(Long userId);

    // 피드용: 공개된 완료 약속을 최신순으로 조회 (페이징 지원)
    List<Appointment> findAllByStatusAndIsPublicTrueOrderByCompletedAtDesc(
        AppointmentStatus status,
        Pageable pageable
    );

    // 피드용 (확장): 공개된 약속을 여러 상태로 조회 (SCHEDULED, ARRIVED, COMPLETED)
    List<Appointment> findAllByStatusInAndIsPublicTrueOrderByUpdatedAtDesc(
        List<AppointmentStatus> statuses,
        Pageable pageable
    );

    // 만료 처리용: 특정 상태이면서 예정 시간이 지난 약속들을 배치 업데이트
    @Modifying
    @Query("UPDATE Appointment a SET a.status = :newStatus " +
           "WHERE a.status IN :currentStatuses " +
           "AND a.scheduledAt < :expirationTime")
    int updateExpiredAppointments(
        @Param("newStatus") AppointmentStatus newStatus,
        @Param("currentStatuses") List<AppointmentStatus> currentStatuses,
        @Param("expirationTime") LocalDateTime expirationTime
    );
}