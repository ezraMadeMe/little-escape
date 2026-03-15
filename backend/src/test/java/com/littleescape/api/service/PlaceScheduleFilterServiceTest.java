package com.littleescape.api.service;

import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.PlaceDetailFacility;
import com.littleescape.api.domain.PlaceDetailPerformance;
import com.littleescape.api.domain.type.MissionCategory;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class PlaceScheduleFilterServiceTest {

    private final PlaceScheduleFilterService service = new PlaceScheduleFilterService();

    @Test
    void filterPlacesBySchedule_excludesNotStartedPerformance() {
        Place performancePlace = place("Future Performance");
        performancePlace.setPerformanceDetail(PlaceDetailPerformance.builder()
                .startDate(LocalDate.of(2025, 1, 10))
                .endDate(LocalDate.of(2025, 1, 31))
                .performanceState("UPCOMING")
                .build());

        PlaceScheduleFilterService.PlaceScheduleFilterResult result = service.filterPlacesBySchedule(
                java.util.List.of(performancePlace),
                LocalDateTime.of(2025, 1, 5, 19, 0),
                LocalDate.of(2025, 1, 5)
        );

        assertThat(result.afterCount()).isZero();
        assertThat(result.notStartedCount()).isEqualTo(1);
        assertThat(result.exclusionDetails())
                .extracting(PlaceScheduleFilterService.ScheduleFilterDecision::reasonCode)
                .containsExactly("EXCLUDE_NOT_YET_STARTED");
    }

    @Test
    void filterPlacesBySchedule_excludesClosedDay() {
        Place library = place("Monday Closed Library");
        library.setFacilityDetail(PlaceDetailFacility.builder()
                .closedDays("매주 월요일")
                .operatingTime("09:00-18:00")
                .build());

        PlaceScheduleFilterService.PlaceScheduleFilterResult result = service.filterPlacesBySchedule(
                java.util.List.of(library),
                LocalDateTime.of(2025, 1, 6, 10, 0),
                LocalDate.of(2025, 1, 6)
        );

        assertThat(result.afterCount()).isZero();
        assertThat(result.closedDayCount()).isEqualTo(1);
        assertThat(result.exclusionDetails().get(0).reasonCode()).isEqualTo("EXCLUDE_CLOSED_DAY");
    }

    @Test
    void filterPlacesBySchedule_excludesOutsideOperatingHours() {
        Place facility = place("Daytime Facility");
        facility.setFacilityDetail(PlaceDetailFacility.builder()
                .operatingTime("09:00-18:00")
                .closedDays("없음")
                .build());

        PlaceScheduleFilterService.PlaceScheduleFilterResult result = service.filterPlacesBySchedule(
                java.util.List.of(facility),
                LocalDateTime.of(2025, 1, 7, 20, 0),
                LocalDate.of(2025, 1, 7)
        );

        assertThat(result.afterCount()).isZero();
        assertThat(result.outsideOperatingHoursCount()).isEqualTo(1);
        assertThat(result.exclusionDetails().get(0).reasonCode()).isEqualTo("EXCLUDE_OUTSIDE_OPERATING_HOURS");
    }

    @Test
    void filterPlacesBySchedule_keepsPlaceWhenOperationalInfoIsUnparseable() {
        Place facility = place("Unknown Hours Facility");
        facility.setFacilityDetail(PlaceDetailFacility.builder()
                .operatingTime("문의 후 방문")
                .closedDays("공휴일")
                .build());

        PlaceScheduleFilterService.PlaceScheduleFilterResult result = service.filterPlacesBySchedule(
                java.util.List.of(facility),
                LocalDateTime.of(2025, 1, 7, 14, 0),
                LocalDate.of(2025, 1, 7)
        );

        assertThat(result.afterCount()).isEqualTo(1);
        assertThat(result.unknownOperationalInfoCount()).isEqualTo(1);
        assertThat(result.exclusionDetails()).isEmpty();
    }

    private Place place(String name) {
        return Place.builder()
                .name(name)
                .address(name + " address")
                .url("https://example.com/" + name.replace(' ', '-'))
                .latitude(37.5)
                .longitude(127.0)
                .category(MissionCategory.CULTURE)
                .isActive(true)
                .build();
    }
}
