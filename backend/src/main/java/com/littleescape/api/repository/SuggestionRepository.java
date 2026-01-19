package com.littleescape.api.repository;

import com.littleescape.api.domain.Suggestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SuggestionRepository extends JpaRepository<Suggestion, Long> {
}
