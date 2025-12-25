package com.littleescape.api.repo;

import com.littleescape.api.domain.CandidateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CandidateRepo extends JpaRepository<CandidateEntity, UUID> {
  List<CandidateEntity> findByPrepIdOrderByOrderIndexAsc(UUID prepId);
  void deleteByPrepId(UUID prepId);
}
