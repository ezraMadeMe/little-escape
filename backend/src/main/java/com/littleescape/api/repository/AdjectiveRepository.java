package com.littleescape.api.repository;

import com.littleescape.api.domain.Adjective;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdjectiveRepository extends JpaRepository<Adjective, Long> {

    @Query(value = "SELECT * FROM adjectives ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    Optional<Adjective> findRandomAdjective();
}
