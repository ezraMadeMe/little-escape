package com.littleescape.api.repository;

import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.type.LocationType;
import com.littleescape.api.domain.type.TimeOfDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MissionTemplateRepository extends JpaRepository<MissionTemplate, Long> {

    List<MissionTemplate> findAllByTimeOfDayInAndLocationTypeIn(
            List<TimeOfDay> timeOfDays,
            List<LocationType> locationTypes
    );
}
