package com.littleescape.api.service;

import com.littleescape.api.domain.type.LocationType;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.domain.type.TimeOfDay;
import com.littleescape.api.domain.type.Congestion;
import com.littleescape.api.service.simulation.EnvironmentContext;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class RecommendationSupportService {

    private static final double BASE_LIBRARY_WEIGHT = 0.3;

    public List<TimeOfDay> resolveTimeOfDayOptions(LocalDateTime targetDateTime) {
        LocalDateTime effectiveDateTime = targetDateTime != null ? targetDateTime : LocalDateTime.now();
        int hour = effectiveDateTime.getHour();
        List<TimeOfDay> times = new ArrayList<>();

        if (hour >= 6 && hour < 12) {
            times.add(TimeOfDay.MORNING);
        } else if (hour >= 12 && hour < 18) {
            times.add(TimeOfDay.AFTERNOON);
        } else {
            times.add(TimeOfDay.NIGHT);
        }

        times.add(TimeOfDay.ANY);
        return times;
    }

    public List<TimeOfDay> resolveTimeOfDayOptions(EnvironmentContext context) {
        return resolveTimeOfDayOptions(context != null ? context.getTargetDateTime() : null);
    }

    public List<LocationType> resolveLocationTypes(boolean outdoorRestricted, boolean indoorPreferred) {
        List<LocationType> locations = new ArrayList<>();

        if (outdoorRestricted || indoorPreferred) {
            locations.add(LocationType.INDOOR);
            locations.add(LocationType.ANY);
            return locations;
        }

        locations.add(LocationType.INDOOR);
        locations.add(LocationType.OUTDOOR);
        locations.add(LocationType.ANY);
        return locations;
    }

    public List<LocationType> resolveLocationTypes(EnvironmentContext context) {
        if (context == null) {
            return resolveLocationTypes(false, false);
        }
        return resolveLocationTypes(context.isOutdoorRestricted(), context.isIndoorPreferred());
    }

    public List<MissionCategory> mapMissionToPlaceCategories(MissionCategory missionCategory) {
        List<MissionCategory> mapping = new ArrayList<>();

        switch (missionCategory) {
            case ACTIVITY:
                mapping.add(MissionCategory.ACTIVITY);
                mapping.add(MissionCategory.CULTURE);
                break;
            case CULTURE:
                mapping.add(MissionCategory.CULTURE);
                break;
            case RELAX:
                mapping.add(MissionCategory.RELAX);
                mapping.add(MissionCategory.CULTURE);
                break;
            case FOOD:
                mapping.add(MissionCategory.FOOD);
                mapping.add(MissionCategory.RELAX);
                break;
            default:
                mapping.add(missionCategory);
                break;
        }

        return mapping;
    }

    public double resolveLibrarySourceWeight(EnvironmentContext context) {
        if (context == null) {
            return BASE_LIBRARY_WEIGHT;
        }

        double libraryWeight = BASE_LIBRARY_WEIGHT;
        if (context.getCongestion() == null) {
            return libraryWeight;
        }

        if (context.getCongestion() == Congestion.HIGH && context.isIntrovert()) {
            return libraryWeight + 0.3;
        }

        if (context.getCongestion() == Congestion.NORMAL && context.isIntrovert()) {
            return libraryWeight + 0.15;
        }

        if (context.getCongestion() == Congestion.LOW && context.isExtrovert()) {
            return Math.max(0.1, libraryWeight - 0.1);
        }

        return libraryWeight;
    }

    public String describeLibrarySourceWeight(EnvironmentContext context) {
        double libraryWeight = resolveLibrarySourceWeight(context);
        if (context == null) {
            return String.format("Library base weight %.2f (no environment context)", libraryWeight);
        }

        if (context.getCongestion() == null) {
            return String.format("Library base weight %.2f (no congestion)", libraryWeight);
        }

        if (context.getCongestion() == Congestion.HIGH && context.isIntrovert()) {
            return String.format("Library base weight 0.30 -> %.2f (HIGH + I)", libraryWeight);
        }

        if (context.getCongestion() == Congestion.NORMAL && context.isIntrovert()) {
            return String.format("Library base weight 0.30 -> %.2f (NORMAL + I)", libraryWeight);
        }

        if (context.getCongestion() == Congestion.LOW && context.isExtrovert()) {
            return String.format("Library base weight 0.30 -> %.2f (LOW + E)", libraryWeight);
        }

        return String.format("Library base weight %.2f (no MBTI/congestion adjustment)", libraryWeight);
    }
}
