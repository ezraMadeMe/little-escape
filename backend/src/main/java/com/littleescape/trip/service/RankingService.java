package com.littleescape.trip.service;

import com.littleescape.trip.domain.TripSession;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class RankingService {

    public List<RecommendationService.CandidateDraft> rank(
            TripSession session,
            List<RecommendationService.CandidateDraft> candidates,
            int size
    ) {
        // TODO: 실제 스코어링으로 교체
        return candidates.stream()
                .sorted(Comparator.comparingDouble(RecommendationService.CandidateDraft::score).reversed())
                .limit(size)
                .toList();
    }
}