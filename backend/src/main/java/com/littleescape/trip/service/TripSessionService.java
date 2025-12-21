package com.littleescape.trip.service;

import com.littleescape.common.error.BizException;
import com.littleescape.common.error.ErrorCode;
import com.littleescape.recommend.domain.Candidate;
import com.littleescape.recommend.repo.CandidateRepository;
import com.littleescape.route.domain.RoutePlan;
import com.littleescape.route.repo.RoutePlanRepository;
import com.littleescape.trip.domain.TripSession;
import com.littleescape.trip.dto.TripDtos;
import com.littleescape.trip.repo.TripSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TripSessionService {

    private final TripSessionRepository tripSessionRepository;
    private final CandidateRepository candidateRepository;
    private final RoutePlanRepository routePlanRepository;
    private final RecommendationService recommendationService;
    private final NavigationLinkService navigationLinkService;

    public TripSessionService(
            TripSessionRepository tripSessionRepository,
            CandidateRepository candidateRepository,
            RoutePlanRepository routePlanRepository,
            RecommendationService recommendationService,
            NavigationLinkService navigationLinkService
    ) {
        this.tripSessionRepository = tripSessionRepository;
        this.candidateRepository = candidateRepository;
        this.routePlanRepository = routePlanRepository;
        this.recommendationService = recommendationService;
        this.navigationLinkService = navigationLinkService;
    }

    @Transactional
    public TripDtos.TripSessionCreateResponse createSession(Long userId, TripDtos.TripSessionCreateRequest req) {
        String constraintsJson = (req.constraintsJson() == null) ? "{}" : req.constraintsJson();
        String moodTagsJson = (req.moodTags() == null) ? "[]" : req.moodTags().toString(); // TODO: JSON serialize

        TripSession session = new TripSession(
                userId,
                req.mode(),
                req.origin().lat(),
                req.origin().lng(),
                req.budget().type(),
                req.budget().value(),
                constraintsJson,
                moodTagsJson
        );
        tripSessionRepository.save(session);

        List<TripDtos.CandidateCard> cards = recommendationService.generateRecommendations(session, 10);
        return new TripDtos.TripSessionCreateResponse(session.getId(), cards);
    }

    @Transactional
    public TripDtos.RejectResponse reject(Long userId, Long sessionId, TripDtos.RejectRequest req) {
        TripSession session = tripSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> BizException.notFound("Session not found"));

        // TODO: 거절 로그 저장 / reject profile 업데이트

        List<TripDtos.CandidateCard> cards = recommendationService.generateRecommendations(session, 10);
        return new TripDtos.RejectResponse(cards);
    }

    @Transactional
    public TripDtos.AcceptResponse accept(Long userId, Long sessionId, TripDtos.AcceptRequest req) {
        TripSession session = tripSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> BizException.notFound("Session not found"));

        Candidate candidate = candidateRepository.findByIdAndSessionId(req.candidateId(), sessionId)
                .orElseThrow(() -> new BizException(ErrorCode.NOT_FOUND, "Candidate not found"));

        session.accept(candidate.getId());

        TripDtos.RouteDto routeDto = null;
        if (candidate.getRoutePlanId() != null) {
            RoutePlan routePlan = routePlanRepository.findById(candidate.getRoutePlanId())
                    .orElseThrow(() -> BizException.notFound("RoutePlan not found"));
            routeDto = new TripDtos.RouteDto(routePlan.getDistanceM(), routePlan.getDurationSec(), routePlan.getPolyline());
        }

        String deeplink = navigationLinkService.buildKakaoMapRouteLink(
                session.getOriginLat(), session.getOriginLng(),
                candidate.getDestLat(), candidate.getDestLng(),
                session.getMode().name()
        );

        return new TripDtos.AcceptResponse(
                candidate.getId(),
                routeDto,
                new TripDtos.NavigationDto("KAKAO_MAP", deeplink)
        );
    }

    @Transactional
    public TripDtos.CompleteResponse complete(Long userId, Long sessionId) {
        TripSession session = tripSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> BizException.notFound("Session not found"));

        session.complete();
        return new TripDtos.CompleteResponse("COMPLETED");
    }
}