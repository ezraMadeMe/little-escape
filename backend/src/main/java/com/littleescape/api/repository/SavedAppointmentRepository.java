package com.littleescape.api.repository;

import com.littleescape.api.domain.SavedAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SavedAppointmentRepository extends JpaRepository<SavedAppointment, Long> {

    boolean existsByUserIdAndAppointmentId(Long userId, Long appointmentId);

    Optional<SavedAppointment> findByUserIdAndAppointmentId(Long userId, Long appointmentId);

    List<SavedAppointment> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Long countByUserId(Long userId);

    Long countByAppointmentId(Long appointmentId);

    @Query("""
        SELECT mt.category as category, COUNT(sa.id) as count
        FROM SavedAppointment sa
        JOIN sa.appointment a
        JOIN a.missionTemplate mt
        WHERE sa.user.id = :userId
        GROUP BY mt.category
        """)
    List<Object[]> findCategoryStatsByUserId(@Param("userId") Long userId);

    @Query("""
        SELECT p.dataSource as dataSource, COUNT(sa.id) as count
        FROM SavedAppointment sa
        JOIN sa.appointment a
        JOIN a.place p
        WHERE sa.user.id = :userId
        GROUP BY p.dataSource
        """)
    List<Object[]> findPlaceDataSourceStatsByUserId(@Param("userId") Long userId);

    void deleteByUserId(Long userId);

    void deleteByAppointmentId(Long appointmentId);
}
