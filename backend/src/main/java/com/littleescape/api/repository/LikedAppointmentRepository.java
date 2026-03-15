package com.littleescape.api.repository;

import com.littleescape.api.domain.LikedAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LikedAppointmentRepository extends JpaRepository<LikedAppointment, Long> {

    boolean existsByUserIdAndAppointmentId(Long userId, Long appointmentId);

    Optional<LikedAppointment> findByUserIdAndAppointmentId(Long userId, Long appointmentId);

    List<LikedAppointment> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Long countByUserId(Long userId);

    Long countByAppointmentId(Long appointmentId);

    @Query("""
        SELECT mt.category as category, COUNT(la.id) as count
        FROM LikedAppointment la
        JOIN la.appointment a
        JOIN a.missionTemplate mt
        WHERE la.user.id = :userId
        GROUP BY mt.category
        """)
    List<Object[]> findCategoryStatsByUserId(@Param("userId") Long userId);

    @Query("""
        SELECT p.dataSource as dataSource, COUNT(la.id) as count
        FROM LikedAppointment la
        JOIN la.appointment a
        JOIN a.place p
        WHERE la.user.id = :userId
        GROUP BY p.dataSource
        """)
    List<Object[]> findPlaceDataSourceStatsByUserId(@Param("userId") Long userId);

    void deleteByUserId(Long userId);

    void deleteByAppointmentId(Long appointmentId);
}
