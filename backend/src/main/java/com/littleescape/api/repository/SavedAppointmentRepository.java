package com.littleescape.api.repository;

import com.littleescape.api.domain.SavedAppointment;
import com.littleescape.api.domain.type.MissionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface SavedAppointmentRepository extends JpaRepository<SavedAppointment, Long> {

    // 특정 사용자와 약속의 저장 여부 확인
    boolean existsByUserIdAndAppointmentId(Long userId, Long appointmentId);

    // 특정 사용자와 약속의 저장 레코드 조회
    Optional<SavedAppointment> findByUserIdAndAppointmentId(Long userId, Long appointmentId);

    // 특정 사용자가 저장한 모든 약속 조회 (최신순)
    List<SavedAppointment> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    // 저장 개수 조회
    Long countByUserId(Long userId);

    /**
     * 사용자가 저장한 약속들의 카테고리별 통계 조회
     * 추천 알고리즘에서 가중치 계산에 사용
     *
     * @param userId 사용자 ID
     * @return 카테고리별 저장 횟수 (Map<Category, Count>)
     */
    @Query("""
        SELECT mt.category as category, COUNT(sa.id) as count
        FROM SavedAppointment sa
        JOIN sa.appointment a
        JOIN a.missionTemplate mt
        WHERE sa.user.id = :userId
        GROUP BY mt.category
        """)
    List<Object[]> findCategoryStatsByUserId(@Param("userId") Long userId);

    /**
     * 사용자 삭제 시 저장 레코드도 함께 삭제
     */
    void deleteByUserId(Long userId);
}
