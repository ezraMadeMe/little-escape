package com.littleescape.api.dto;

import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.type.LocationType;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.domain.type.TimeOfDay;

public record MissionTemplateResponse(
    Long id,
    String title,
    String description,
    MissionCategory category,
    String difficultyLevel,
    String condition,
    String imageUrl,
    LocationType locationType,
    TimeOfDay timeOfDay,
    String guide
) {
    public static MissionTemplateResponse from(MissionTemplate missionTemplate) {
        return new MissionTemplateResponse(
            missionTemplate.getId(),
            missionTemplate.getTitle(),
            missionTemplate.getDescription(),
            missionTemplate.getCategory(),
            missionTemplate.getDifficultyLevel(),
            missionTemplate.getCondition(),
            missionTemplate.getImageUrl(),
            missionTemplate.getLocationType(),
            missionTemplate.getTimeOfDay(),
            missionTemplate.getGuide()
        );
    }
}
