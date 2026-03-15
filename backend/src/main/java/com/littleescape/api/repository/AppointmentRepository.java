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

    List<Appointment> findAllByUserIdOrderByScheduledAtDesc(Long userId);

    Long countByUserIdAndMissionTemplateId(Long userId, Long missionTemplateId);

    boolean existsByUserIdAndStatusIn(Long userId, List<AppointmentStatus> statuses);

    List<Appointment> findAllByScheduledAtBetween(LocalDateTime start, LocalDateTime end);

    List<Appointment> findAllByStatusAndScheduledAtBetween(
            AppointmentStatus status,
            LocalDateTime start,
            LocalDateTime end
    );

    java.util.Optional<Appointment> findByUnlockToken(String unlockToken);

    void deleteByUserId(Long userId);

    List<Appointment> findAllByStatusAndIsPublicTrueOrderByCompletedAtDesc(
            AppointmentStatus status,
            Pageable pageable
    );

    List<Appointment> findAllByStatusInAndIsPublicTrueOrderByUpdatedAtDesc(
            List<AppointmentStatus> statuses,
            Pageable pageable
    );

    @Modifying
    @Query("UPDATE Appointment a SET a.status = :newStatus " +
           "WHERE a.status IN :currentStatuses " +
           "AND a.scheduledAt < :expirationTime")
    int updateExpiredAppointments(
            @Param("newStatus") AppointmentStatus newStatus,
            @Param("currentStatuses") List<AppointmentStatus> currentStatuses,
            @Param("expirationTime") LocalDateTime expirationTime
    );

    @Query("SELECT a FROM Appointment a " +
           "WHERE a.isMissionRevealed = false " +
           "AND a.missionTemplate IS NOT NULL " +
           "AND a.status IN :activeStatuses " +
           "AND a.scheduledAt BETWEEN :now AND :tomorrow")
    List<Appointment> findMissionRevealTargets(
            @Param("activeStatuses") List<AppointmentStatus> activeStatuses,
            @Param("now") LocalDateTime now,
            @Param("tomorrow") LocalDateTime tomorrow
    );

    @Modifying
    @Query("UPDATE Appointment a SET a.isMissionRevealed = true " +
           "WHERE a.isMissionRevealed = false " +
           "AND a.missionTemplate IS NOT NULL " +
           "AND a.status IN :activeStatuses " +
           "AND a.scheduledAt BETWEEN :now AND :tomorrow")
    int revealMissionsForD1(
            @Param("activeStatuses") List<AppointmentStatus> activeStatuses,
            @Param("now") LocalDateTime now,
            @Param("tomorrow") LocalDateTime tomorrow
    );

    @Query("""
        SELECT mt.category as category, COUNT(a.id) as count
        FROM Appointment a
        JOIN a.missionTemplate mt
        WHERE a.user.id = :userId
          AND a.status IN :statuses
        GROUP BY mt.category
        """)
    List<Object[]> findCategoryStatsByUserIdAndStatuses(
            @Param("userId") Long userId,
            @Param("statuses") List<AppointmentStatus> statuses
    );

    @Query("""
        SELECT p.dataSource as dataSource, COUNT(a.id) as count
        FROM Appointment a
        JOIN a.place p
        WHERE a.user.id = :userId
          AND a.status IN :statuses
        GROUP BY p.dataSource
        """)
    List<Object[]> findPlaceDataSourceStatsByUserIdAndStatuses(
            @Param("userId") Long userId,
            @Param("statuses") List<AppointmentStatus> statuses
    );
}
