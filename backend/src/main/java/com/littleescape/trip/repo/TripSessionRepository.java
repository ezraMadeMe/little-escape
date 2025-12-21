package com.littleescape.trip.repo;

import com.littleescape.trip.domain.TripSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TripSessionRepository extends JpaRepository<TripSession, Long> {
    Optional<TripSession> findByIdAndUserId(Long id, Long userId);
}