package com.littleescape.api.repository;

import com.littleescape.api.domain.MissionTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MissionTemplateRepository extends JpaRepository<MissionTemplate, Long> {
}
