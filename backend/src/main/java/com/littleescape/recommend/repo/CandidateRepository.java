package com.littleescape.recommend.repo;

import com.littleescape.recommend.domain.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    List<Candidate> findTop10BySessionIdOrderByScoreDesc(Long sessionId);
    Optional<Candidate> findByIdAndSessionId(Long id, Long sessionId);
}