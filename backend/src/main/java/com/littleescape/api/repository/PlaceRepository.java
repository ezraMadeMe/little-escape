package com.littleescape.api.repository;

import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.type.MissionCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlaceRepository extends JpaRepository<Place, Long> {
    List<Place> findByCategory(MissionCategory category);
}
