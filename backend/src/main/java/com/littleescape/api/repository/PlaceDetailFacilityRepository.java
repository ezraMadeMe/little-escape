package com.littleescape.api.repository;

import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.PlaceDetailFacility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlaceDetailFacilityRepository extends JpaRepository<PlaceDetailFacility, Long> {

    Optional<PlaceDetailFacility> findByPlace(Place place);

    Optional<PlaceDetailFacility> findByPlaceId(Long placeId);
}
