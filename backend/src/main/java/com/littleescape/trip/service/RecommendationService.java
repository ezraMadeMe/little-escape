package com.littleescape.trip.service;

import com.littleescape.recommend.domain.Candidate;
import com.littleescape.recommend.repo.CandidateRepository;
import com.littleescape.trip.domain.TripSession;
import com.littleescape.trip.dto.TripDtos;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class RecommendationService {

    private final CandidateRepository candidateRepository;
    private final CandidateGenerator candidateGenerator;
    private final PlaceService placeService;
    private final RouteService routeService;
    private final RankingService rankingService;

    public RecommendationService(
            CandidateRepository candidateRepository,
            CandidateGenerator candidateGenerator,
            PlaceService placeService,
            RouteService routeService,
            RankingService rankingService
    ) {
        this.candidateRepository = candidateRepository;
        this.candidateGenerator = candidateGenerator;
        this.placeService = placeService;
        this.routeService = routeService;
        this.rankingService = rankingService;
    }

    @Transactional
    public List<TripDtos.CandidateCard> generateRecommendations(TripSession session, int size) {
        var seeds = candidateGenerator.generate(session, 20);

        var drafts = new ArrayList<CandidateDraft>();
        for (var seed : seeds) {
            RouteResult routeResult = routeService.tryBuildRoute(session, seed);
            if (!routeResult.accepted()) continue;

            String poiJson = placeService.fetchNearbyPoiJson(seed.destLat(), seed.destLng());
            drafts.add(new CandidateDraft(
                    seed.destLat(), seed.destLng(),
                    seed.destName(), seed.areaName(),
                    poiJson,
                    routeResult.routePlanId(),
                    routeResult.estDurationMin(),
                    0.0,
                    "{}"
            ));
        }

        // TODO: rankingService에서 score/features를 채우도록 개선해도 됨
        var ranked = rankingService.rank(session, drafts, size);

        List<TripDtos.CandidateCard> cards = new ArrayList<>();
        for (CandidateDraft d : ranked) {
            Candidate entity = new Candidate(
                    session.getId(),
                    d.destLat(), d.destLng(),
                    d.destName(), d.areaName(),
                    d.score(),
                    d.featuresJson(),
                    d.poiJson(),
                    d.routePlanId()
            );
            candidateRepository.save(entity);

            cards.add(new TripDtos.CandidateCard(
                    entity.getId(),
                    d.destName(),
                    d.areaName(),
                    d.destLat(),
                    d.destLng(),
                    d.score(),
                    d.poiJson(),
                    d.estDurationMin()
            ));
        }
        return cards;
    }

    public record CandidateDraft(
            double destLat, double destLng,
            String destName, String areaName,
            String poiJson,
            Long routePlanId,
            Integer estDurationMin,
            double score,
            String featuresJson
    ) {}

    public record RouteResult(boolean accepted, Long routePlanId, Integer estDurationMin) {}
}