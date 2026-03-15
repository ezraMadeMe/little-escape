package com.littleescape.api.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RecommendationTagConflictService {

    private static final List<TagConflictRule> RULES = List.of(
            new TagConflictRule(
                    "NO_ALCOHOL",
                    "ALCOHOL_ONLY",
                    "USER_TAG_CONFLICT_NO_ALCOHOL",
                    "userTag=NO_ALCOHOL,targetTag=ALCOHOL_ONLY"
            ),
            new TagConflictRule(
                    "HATE_WALKING",
                    "HIGH_ACTIVITY",
                    "USER_TAG_CONFLICT_HATE_WALKING",
                    "userTag=HATE_WALKING,targetTag=HIGH_ACTIVITY"
            ),
            new TagConflictRule(
                    "NO_SPORTS",
                    "SPORTS_REQUIRED",
                    "USER_TAG_CONFLICT_NO_SPORTS",
                    "userTag=NO_SPORTS,targetTag=SPORTS_REQUIRED"
            ),
            new TagConflictRule(
                    "INDOOR_ONLY",
                    "OUTDOOR_REQUIRED",
                    "USER_TAG_CONFLICT_INDOOR_ONLY",
                    "userTag=INDOOR_ONLY,targetTag=OUTDOOR_REQUIRED"
            )
    );

    private static final Set<String> HARD_CONSTRAINT_TAGS = RULES.stream()
            .map(TagConflictRule::userTag)
            .collect(Collectors.toUnmodifiableSet());

    public boolean hasConflict(String userTags, String targetTags) {
        Set<String> normalizedUserTags = normalizeTags(userTags);
        Set<String> normalizedTargetTags = normalizeTags(targetTags);

        if (normalizedUserTags.isEmpty() || normalizedTargetTags.isEmpty()) {
            return false;
        }

        return RULES.stream().anyMatch(rule ->
                normalizedUserTags.contains(rule.userTag())
                        && normalizedTargetTags.contains(rule.targetTag())
        );
    }

    public List<String> normalizeUserTags(String userTags) {
        return List.copyOf(normalizeTags(userTags));
    }

    public List<String> normalizeHardConstraintTags(String userTags) {
        return normalizeTags(userTags).stream()
                .filter(HARD_CONSTRAINT_TAGS::contains)
                .toList();
    }

    public <T> TagConflictFilterResult<T> filterConflicts(
            List<T> candidates,
            String userTags,
            Function<T, String> targetTagsExtractor
    ) {
        List<String> normalizedUserTags = normalizeHardConstraintTags(userTags);
        if (normalizedUserTags.isEmpty() || candidates.isEmpty()) {
            return new TagConflictFilterResult<>(List.copyOf(candidates), List.of(), normalizedUserTags);
        }

        List<T> current = new ArrayList<>(candidates);
        List<TagConflictStep> steps = new ArrayList<>();

        for (TagConflictRule rule : RULES) {
            if (!normalizedUserTags.contains(rule.userTag())) {
                continue;
            }

            int before = current.size();
            current = current.stream()
                    .filter(candidate -> !normalizeTags(targetTagsExtractor.apply(candidate)).contains(rule.targetTag()))
                    .collect(Collectors.toList());

            steps.add(new TagConflictStep(
                    rule.reasonCode(),
                    before,
                    current.size(),
                    rule.detail()
            ));
        }

        return new TagConflictFilterResult<>(List.copyOf(current), List.copyOf(steps), normalizedUserTags);
    }

    private LinkedHashSet<String> normalizeTags(String tags) {
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        if (tags == null || tags.isBlank()) {
            return normalized;
        }

        for (String token : tags.split(",")) {
            String value = token.trim().toUpperCase();
            if (!value.isEmpty()) {
                normalized.add(value);
            }
        }
        return normalized;
    }

    private record TagConflictRule(
            String userTag,
            String targetTag,
            String reasonCode,
            String detail
    ) {
    }

    public record TagConflictStep(
            String reasonCode,
            int beforeCount,
            int afterCount,
            String detail
    ) {
    }

    public record TagConflictFilterResult<T>(
            List<T> candidates,
            List<TagConflictStep> steps,
            List<String> normalizedUserTags
    ) {
    }
}
