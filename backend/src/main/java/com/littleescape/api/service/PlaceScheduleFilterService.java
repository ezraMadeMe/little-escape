package com.littleescape.api.service;

import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.PlaceDetailFacility;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PlaceScheduleFilterService {

    private static final LocalTime DEFAULT_DATE_ONLY_TIME = LocalTime.NOON;
    private static final Pattern TIME_RANGE_PATTERN = Pattern.compile(
            "(\\d{1,2})(?::(\\d{2}))?\\s*(?:\\uC2DC)?\\s*[-~]\\s*(\\d{1,2})(?::(\\d{2}))?\\s*(?:\\uC2DC)?"
    );
    private static final Pattern DAY_RANGE_PATTERN = Pattern.compile(
            "\\b(MON|TUE|WED|THU|FRI|SAT|SUN)\\b\\s*[-~]\\s*\\b(MON|TUE|WED|THU|FRI|SAT|SUN)\\b"
    );

    public PlaceScheduleFilterResult filterPlacesBySchedule(
            List<Place> places,
            LocalDate targetDate,
            LocalDate today
    ) {
        LocalDate effectiveTargetDate = targetDate != null ? targetDate : LocalDate.now();
        return filterPlacesBySchedule(
                places,
                LocalDateTime.of(effectiveTargetDate, DEFAULT_DATE_ONLY_TIME),
                today
        );
    }

    public PlaceScheduleFilterResult filterPlacesBySchedule(
            List<Place> places,
            LocalDateTime targetDateTime,
            LocalDate today
    ) {
        if (places.isEmpty()) {
            return new PlaceScheduleFilterResult(
                    new ArrayList<>(),
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    List.of()
            );
        }

        LocalDateTime effectiveTargetDateTime = targetDateTime != null ? targetDateTime : LocalDateTime.now();
        LocalDate effectiveTargetDate = effectiveTargetDateTime.toLocalDate();
        LocalDate effectiveToday = today != null ? today : LocalDate.now();

        int beforeCount = places.size();
        int deactivatedCount = 0;
        int expiredCount = 0;
        int notStartedCount = 0;
        int closedDayCount = 0;
        int outsideOperatingHoursCount = 0;
        int unavailableOperationInfoCount = 0;
        int unknownOperationalInfoCount = 0;

        List<Place> filteredPlaces = new ArrayList<>();
        List<ScheduleFilterDecision> exclusionDetails = new ArrayList<>();

        for (Place place : places) {
            LocalDate startDate = getPlaceStartDate(place);
            LocalDate endDate = getPlaceEndDate(place);

            if (endDate != null && endDate.isBefore(effectiveToday)) {
                place.deactivate();
                deactivatedCount++;
                exclusionDetails.add(decision(
                        place,
                        "DEACTIVATE_EXPIRED_PERFORMANCE",
                        "endDate=" + endDate + ", today=" + effectiveToday
                ));
                continue;
            }

            boolean afterStart = startDate == null || !effectiveTargetDate.isBefore(startDate);
            boolean beforeEnd = endDate == null || !effectiveTargetDate.isAfter(endDate);
            if (!afterStart || !beforeEnd) {
                if (!afterStart) {
                    notStartedCount++;
                    exclusionDetails.add(decision(
                            place,
                            "EXCLUDE_NOT_YET_STARTED",
                            "targetDate=" + effectiveTargetDate + ", startDate=" + startDate
                    ));
                } else {
                    expiredCount++;
                    exclusionDetails.add(decision(
                            place,
                            "EXCLUDE_OUTSIDE_SCHEDULE_DATE",
                            "targetDate=" + effectiveTargetDate + ", endDate=" + endDate
                    ));
                }
                continue;
            }

            OperationalAvailability availability = evaluateOperationalAvailability(place, effectiveTargetDateTime);
            if (!availability.available()) {
                switch (availability.reasonCode()) {
                    case "EXCLUDE_CLOSED_DAY" -> closedDayCount++;
                    case "EXCLUDE_OUTSIDE_OPERATING_HOURS" -> outsideOperatingHoursCount++;
                    default -> unavailableOperationInfoCount++;
                }
                exclusionDetails.add(decision(place, availability.reasonCode(), availability.detail()));
                continue;
            }

            if (availability.unknown()) {
                unknownOperationalInfoCount++;
            }
            filteredPlaces.add(place);
        }

        return new PlaceScheduleFilterResult(
                filteredPlaces,
                beforeCount,
                filteredPlaces.size(),
                deactivatedCount,
                expiredCount,
                notStartedCount,
                closedDayCount,
                outsideOperatingHoursCount,
                unavailableOperationInfoCount,
                unknownOperationalInfoCount,
                List.copyOf(exclusionDetails)
        );
    }

    private OperationalAvailability evaluateOperationalAvailability(Place place, LocalDateTime targetDateTime) {
        String operatingTime = getOperatingTime(place);
        String closedDays = getClosedDays(place);
        boolean hasOperationalInfo = hasText(operatingTime) || hasText(closedDays);

        if (!hasOperationalInfo) {
            return OperationalAvailability.available(false);
        }

        String normalizedCombined = normalizeOperationalText((closedDays == null ? "" : closedDays) + " " +
                (operatingTime == null ? "" : operatingTime));
        if (containsAny(normalizedCombined,
                "TEMPORARILY CLOSED",
                "CLOSED PERMANENTLY",
                "PERMANENTLY CLOSED",
                "운영종료",
                "영업종료",
                "임시휴관",
                "임시휴업",
                "운영중단",
                "휴업",
                "폐업",
                "미운영")) {
            return OperationalAvailability.unavailable(
                    "EXCLUDE_CLEARLY_UNAVAILABLE_OPERATION_INFO",
                    "operationalStatus=" + summarizeRaw(closedDays, operatingTime),
                    false
            );
        }

        DayEvaluation closedDayEvaluation = evaluateClosedDays(closedDays, targetDateTime.toLocalDate());
        if (closedDayEvaluation.closed()) {
            return OperationalAvailability.unavailable(
                    "EXCLUDE_CLOSED_DAY",
                    closedDayEvaluation.detail(),
                    false
            );
        }

        OperatingHoursEvaluation operatingHoursEvaluation = evaluateOperatingHours(operatingTime, targetDateTime);
        if (operatingHoursEvaluation.closed()) {
            return OperationalAvailability.unavailable(
                    "EXCLUDE_OUTSIDE_OPERATING_HOURS",
                    operatingHoursEvaluation.detail(),
                    false
            );
        }

        boolean unknown = closedDayEvaluation.unknown() || operatingHoursEvaluation.unknown();
        return OperationalAvailability.available(unknown);
    }

    private DayEvaluation evaluateClosedDays(String closedDays, LocalDate targetDate) {
        if (!hasText(closedDays)) {
            return DayEvaluation.available(false, "no closed-day info");
        }

        String normalized = normalizeOperationalText(closedDays);
        if (containsAny(normalized,
                "EVERYDAY",
                "연중무휴",
                "무휴",
                "휴무없음",
                "휴무 없음",
                "휴관없음",
                "휴관 없음",
                "정기휴무없음",
                "정기휴무 없음",
                "NONE",
                "없음")) {
            return DayEvaluation.available(false, "always open");
        }

        if (containsAny(normalized, "HOLIDAY", "공휴일")) {
            return DayEvaluation.available(true, "holiday closure only");
        }

        if (matchesQualifiedClosedDay(normalized, targetDate)) {
            return DayEvaluation.closed("closedDays=" + closedDays);
        }

        if (containsMonthlyQualifier(normalized)) {
            return DayEvaluation.available(true, "monthly closure rule did not match target date");
        }

        if (appliesToDay(normalized, targetDate.getDayOfWeek())) {
            return DayEvaluation.closed("closedDays=" + closedDays);
        }

        if (containsDayReference(normalized)) {
            return DayEvaluation.available(false, "other day closed");
        }

        return DayEvaluation.available(true, "unparsed closedDays=" + closedDays);
    }

    private OperatingHoursEvaluation evaluateOperatingHours(String operatingTime, LocalDateTime targetDateTime) {
        if (!hasText(operatingTime)) {
            return OperatingHoursEvaluation.available(false, "no operating-time info");
        }

        String normalized = normalizeOperationalText(operatingTime);
        if (containsAny(normalized, "24 HOURS", "24H", "24시간", "연중무휴", "상시운영")) {
            return OperatingHoursEvaluation.available(false, "always open");
        }

        if (containsAny(normalized, "운영종료", "영업종료", "임시휴관", "임시휴업", "운영중단", "폐업", "미운영")
                && !TIME_RANGE_PATTERN.matcher(normalized).find()) {
            return OperatingHoursEvaluation.closed("operatingTime=" + operatingTime);
        }

        String[] segments = normalized.split("\\s*/\\s*|\\s*;\\s*|\\R|,(?=\\s*(MON|TUE|WED|THU|FRI|SAT|SUN|WEEKDAY|WEEKEND|EVERYDAY))");
        List<String> applicableSegments = new ArrayList<>();
        List<String> genericSegments = new ArrayList<>();
        List<String> breakSegments = new ArrayList<>();

        for (String rawSegment : segments) {
            String segment = rawSegment.trim();
            if (segment.isEmpty()) {
                continue;
            }

            DayApplicability applicability = classifyDayApplicability(segment, targetDateTime.getDayOfWeek());
            if (applicability == DayApplicability.DOES_NOT_APPLY) {
                continue;
            }

            boolean isBreakSegment = containsAny(segment, "BREAK", "브레이크", "휴게", "점심");
            if (isBreakSegment) {
                breakSegments.add(segment);
                continue;
            }

            if (applicability == DayApplicability.APPLIES) {
                applicableSegments.add(segment);
            } else {
                genericSegments.add(segment);
            }
        }

        List<String> selectedSegments = !applicableSegments.isEmpty() ? applicableSegments : genericSegments;
        List<TimeRange> operatingRanges = extractTimeRanges(selectedSegments);

        if (operatingRanges.isEmpty()) {
            return OperatingHoursEvaluation.available(true, "unparsed operatingTime=" + operatingTime);
        }

        int targetMinutes = toMinutes(targetDateTime.toLocalTime());
        boolean withinOperatingHours = operatingRanges.stream().anyMatch(range -> range.contains(targetMinutes));
        if (!withinOperatingHours) {
            return OperatingHoursEvaluation.closed("operatingTime=" + operatingTime + ", targetTime=" + targetDateTime.toLocalTime());
        }

        List<TimeRange> breakRanges = extractTimeRanges(breakSegments);
        boolean withinBreak = breakRanges.stream().anyMatch(range -> range.contains(targetMinutes));
        if (withinBreak) {
            return OperatingHoursEvaluation.closed("breakTime=" + operatingTime + ", targetTime=" + targetDateTime.toLocalTime());
        }

        return OperatingHoursEvaluation.available(false, "within operating hours");
    }

    private boolean matchesQualifiedClosedDay(String normalizedClosedDays, LocalDate targetDate) {
        if (!containsDayToken(normalizedClosedDays, tokenFor(targetDate.getDayOfWeek()))) {
            return false;
        }

        int occurrence = ((targetDate.getDayOfMonth() - 1) / 7) + 1;
        boolean isLast = targetDate.plusWeeks(1).getMonth() != targetDate.getMonth();

        return (normalizedClosedDays.contains("FIRST") && occurrence == 1)
                || (normalizedClosedDays.contains("SECOND") && occurrence == 2)
                || (normalizedClosedDays.contains("THIRD") && occurrence == 3)
                || (normalizedClosedDays.contains("FOURTH") && occurrence == 4)
                || (normalizedClosedDays.contains("FIFTH") && occurrence == 5)
                || (normalizedClosedDays.contains("LAST") && isLast);
    }

    private boolean containsMonthlyQualifier(String normalizedClosedDays) {
        return containsAny(normalizedClosedDays, "MONTHLY", "FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "LAST");
    }

    private List<TimeRange> extractTimeRanges(List<String> segments) {
        List<TimeRange> ranges = new ArrayList<>();
        for (String segment : segments) {
            Matcher matcher = TIME_RANGE_PATTERN.matcher(segment);
            while (matcher.find()) {
                Integer start = parseMinutes(matcher.group(1), matcher.group(2));
                Integer end = parseMinutes(matcher.group(3), matcher.group(4));
                if (start != null && end != null) {
                    ranges.add(new TimeRange(start, end));
                }
            }
        }
        return ranges;
    }

    private Integer parseMinutes(String hourText, String minuteText) {
        try {
            int hour = Integer.parseInt(hourText);
            int minute = minuteText != null ? Integer.parseInt(minuteText) : 0;
            if (hour == 24 && minute == 0) {
                return 24 * 60;
            }
            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                return null;
            }
            return (hour * 60) + minute;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private DayApplicability classifyDayApplicability(String normalizedSegment, DayOfWeek targetDay) {
        String targetToken = tokenFor(targetDay);

        if (containsAny(normalizedSegment, "EVERYDAY")) {
            return DayApplicability.APPLIES;
        }

        if (targetDay.getValue() <= DayOfWeek.FRIDAY.getValue() && containsAny(normalizedSegment, "WEEKDAY")) {
            return DayApplicability.APPLIES;
        }

        if (targetDay == DayOfWeek.SATURDAY || targetDay == DayOfWeek.SUNDAY) {
            if (containsAny(normalizedSegment, "WEEKEND")) {
                return DayApplicability.APPLIES;
            }
        }

        Matcher matcher = DAY_RANGE_PATTERN.matcher(normalizedSegment);
        while (matcher.find()) {
            DayOfWeek start = dayOfWeekFor(matcher.group(1));
            DayOfWeek end = dayOfWeekFor(matcher.group(2));
            if (start != null && end != null && isWithinDayRange(targetDay, start, end)) {
                return DayApplicability.APPLIES;
            }
        }

        if (containsDayToken(normalizedSegment, targetToken)) {
            return DayApplicability.APPLIES;
        }

        return containsDayReference(normalizedSegment) ? DayApplicability.DOES_NOT_APPLY : DayApplicability.GENERIC;
    }

    private boolean isWithinDayRange(DayOfWeek target, DayOfWeek start, DayOfWeek end) {
        int targetValue = target.getValue();
        int startValue = start.getValue();
        int endValue = end.getValue();
        if (startValue <= endValue) {
            return targetValue >= startValue && targetValue <= endValue;
        }
        return targetValue >= startValue || targetValue <= endValue;
    }

    private boolean containsDayReference(String normalizedText) {
        return containsAny(normalizedText,
                "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN",
                "WEEKDAY", "WEEKEND", "EVERYDAY");
    }

    private boolean appliesToDay(String normalizedText, DayOfWeek dayOfWeek) {
        return classifyDayApplicability(normalizedText, dayOfWeek) == DayApplicability.APPLIES;
    }

    private boolean containsDayToken(String normalizedText, String token) {
        return normalizedText.contains(" " + token + " ")
                || normalizedText.startsWith(token + " ")
                || normalizedText.endsWith(" " + token)
                || normalizedText.equals(token);
    }

    private String tokenFor(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> "MON";
            case TUESDAY -> "TUE";
            case WEDNESDAY -> "WED";
            case THURSDAY -> "THU";
            case FRIDAY -> "FRI";
            case SATURDAY -> "SAT";
            case SUNDAY -> "SUN";
        };
    }

    private DayOfWeek dayOfWeekFor(String token) {
        return switch (token) {
            case "MON" -> DayOfWeek.MONDAY;
            case "TUE" -> DayOfWeek.TUESDAY;
            case "WED" -> DayOfWeek.WEDNESDAY;
            case "THU" -> DayOfWeek.THURSDAY;
            case "FRI" -> DayOfWeek.FRIDAY;
            case "SAT" -> DayOfWeek.SATURDAY;
            case "SUN" -> DayOfWeek.SUNDAY;
            default -> null;
        };
    }

    private int toMinutes(LocalTime time) {
        return (time.getHour() * 60) + time.getMinute();
    }

    private String normalizeOperationalText(String raw) {
        if (!hasText(raw)) {
            return "";
        }

        String normalized = raw.toUpperCase(Locale.ROOT)
                .replace('∼', '~')
                .replace('～', '~')
                .replace('–', '-')
                .replace('—', '-')
                .replace("부터", "-")
                .replace("까지", "")
                .replace("매월", " MONTHLY ")
                .replace("첫째", " FIRST ")
                .replace("둘째", " SECOND ")
                .replace("셋째", " THIRD ")
                .replace("넷째", " FOURTH ")
                .replace("다섯째", " FIFTH ")
                .replace("마지막", " LAST ")
                .replace("월요일", " MON ")
                .replace("화요일", " TUE ")
                .replace("수요일", " WED ")
                .replace("목요일", " THU ")
                .replace("금요일", " FRI ")
                .replace("토요일", " SAT ")
                .replace("일요일", " SUN ")
                .replace("평일", " WEEKDAY ")
                .replace("주말", " WEEKEND ")
                .replace("매일", " EVERYDAY ")
                .replace("MONDAY", " MON ")
                .replace("TUESDAY", " TUE ")
                .replace("WEDNESDAY", " WED ")
                .replace("THURSDAY", " THU ")
                .replace("FRIDAY", " FRI ")
                .replace("SATURDAY", " SAT ")
                .replace("SUNDAY", " SUN ")
                .replace("WEEKDAYS", " WEEKDAY ")
                .replace("WEEKENDS", " WEEKEND ")
                .replace("DAILY", " EVERYDAY ")
                .replace("TO", "-");

        normalized = replaceStandaloneDayToken(normalized, "월", "MON");
        normalized = replaceStandaloneDayToken(normalized, "화", "TUE");
        normalized = replaceStandaloneDayToken(normalized, "수", "WED");
        normalized = replaceStandaloneDayToken(normalized, "목", "THU");
        normalized = replaceStandaloneDayToken(normalized, "금", "FRI");
        normalized = replaceStandaloneDayToken(normalized, "토", "SAT");
        normalized = replaceStandaloneDayToken(normalized, "일", "SUN");

        normalized = normalized.replaceAll("\\s+", " ").trim();
        return " " + normalized + " ";
    }

    private String replaceStandaloneDayToken(String text, String dayChar, String token) {
        return text.replaceAll("(^|[\\s,./()\\[\\]-])" + dayChar + "(?=$|[\\s,./()\\[\\]~-])", "$1 " + token + " ");
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String summarizeRaw(String closedDays, String operatingTime) {
        StringBuilder builder = new StringBuilder();
        if (hasText(closedDays)) {
            builder.append("closedDays=").append(closedDays);
        }
        if (hasText(operatingTime)) {
            if (builder.length() > 0) {
                builder.append(", ");
            }
            builder.append("operatingTime=").append(operatingTime);
        }
        return builder.toString();
    }

    private LocalDate getPlaceStartDate(Place place) {
        if (place.getPerformanceDetail() != null && place.getPerformanceDetail().getStartDate() != null) {
            return place.getPerformanceDetail().getStartDate();
        }
        return place.getStartDate();
    }

    private LocalDate getPlaceEndDate(Place place) {
        if (place.getPerformanceDetail() != null && place.getPerformanceDetail().getEndDate() != null) {
            return place.getPerformanceDetail().getEndDate();
        }
        return place.getEndDate();
    }

    private String getOperatingTime(Place place) {
        PlaceDetailFacility facilityDetail = place.getFacilityDetail();
        if (facilityDetail != null && hasText(facilityDetail.getOperatingTime())) {
            return facilityDetail.getOperatingTime();
        }
        return place.getOperatingTime();
    }

    private String getClosedDays(Place place) {
        PlaceDetailFacility facilityDetail = place.getFacilityDetail();
        if (facilityDetail != null && hasText(facilityDetail.getClosedDays())) {
            return facilityDetail.getClosedDays();
        }
        return place.getClosedDays();
    }

    private ScheduleFilterDecision decision(Place place, String reasonCode, String detail) {
        return new ScheduleFilterDecision(
                place.getId(),
                place.getName(),
                reasonCode,
                detail
        );
    }

    private enum DayApplicability {
        APPLIES,
        DOES_NOT_APPLY,
        GENERIC
    }

    private record OperationalAvailability(
            boolean available,
            boolean unknown,
            String reasonCode,
            String detail
    ) {
        private static OperationalAvailability available(boolean unknown) {
            return new OperationalAvailability(true, unknown, null, null);
        }

        private static OperationalAvailability unavailable(String reasonCode, String detail, boolean unknown) {
            return new OperationalAvailability(false, unknown, reasonCode, detail);
        }
    }

    private record DayEvaluation(
            boolean closed,
            boolean unknown,
            String detail
    ) {
        private static DayEvaluation closed(String detail) {
            return new DayEvaluation(true, false, detail);
        }

        private static DayEvaluation available(boolean unknown, String detail) {
            return new DayEvaluation(false, unknown, detail);
        }
    }

    private record OperatingHoursEvaluation(
            boolean closed,
            boolean unknown,
            String detail
    ) {
        private static OperatingHoursEvaluation closed(String detail) {
            return new OperatingHoursEvaluation(true, false, detail);
        }

        private static OperatingHoursEvaluation available(boolean unknown, String detail) {
            return new OperatingHoursEvaluation(false, unknown, detail);
        }
    }

    private record TimeRange(int startMinutes, int endMinutes) {
        private boolean contains(int targetMinutes) {
            if (endMinutes == startMinutes) {
                return true;
            }
            if (endMinutes > startMinutes) {
                return targetMinutes >= startMinutes && targetMinutes < endMinutes;
            }
            return targetMinutes >= startMinutes || targetMinutes < endMinutes;
        }
    }

    public record ScheduleFilterDecision(
            Long placeId,
            String placeName,
            String reasonCode,
            String detail
    ) {
    }

    public record PlaceScheduleFilterResult(
            List<Place> filteredPlaces,
            int beforeCount,
            int afterCount,
            int deactivatedCount,
            int expiredCount,
            int notStartedCount,
            int closedDayCount,
            int outsideOperatingHoursCount,
            int unavailableOperationInfoCount,
            int unknownOperationalInfoCount,
            List<ScheduleFilterDecision> exclusionDetails
    ) {
    }
}
