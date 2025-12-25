package com.littleescape.api.service;

import com.littleescape.api.domain.*;
import com.littleescape.api.persist.TravelLineEmbeddable;
import com.littleescape.api.repo.*;
import com.littleescape.api.web.dto.PrepDtos.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

import static com.littleescape.api.domain.Enums.*;

@Service
public class PrepService {

  private final AppointmentRepo appointmentRepo;
  private final PrepRepo prepRepo;
  private final CandidateRepo candidateRepo;
  private final PoiRepo poiRepo;

  public PrepService(AppointmentRepo appointmentRepo, PrepRepo prepRepo, CandidateRepo candidateRepo, PoiRepo poiRepo) {
    this.appointmentRepo = appointmentRepo;
    this.prepRepo = prepRepo;
    this.candidateRepo = candidateRepo;
    this.poiRepo = poiRepo;
  }

  @Transactional
  public PrepWithCandidatesRes createPrepAndCandidates(UUID appointmentId, TravelMode mode, double oLat, double oLng) {
    AppointmentEntity ap = appointmentRepo.findById(appointmentId)
        .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

    // 같은 appointment에 prep 여러 번 만들면 최신 prep만 쓰고 싶다면: 기존 최신 prep 후보 삭제
    prepRepo.findTopByAppointmentIdOrderByPreparedAtDesc(appointmentId).ifPresent(prev -> {
      candidateRepo.deleteByPrepId(prev.id);
    });

    PrepEntity prep = PrepEntity.of(appointmentId, mode, oLat, oLng);
    prepRepo.save(prep);

    List<PoiEntity> pois = poiRepo.findByActiveTrue();
    if (pois.isEmpty()) throw new IllegalArgumentException("POI seed is empty");

    List<CandidateDraft> drafts = recommend(ap, prep, pois);
    if (drafts.isEmpty()) throw new IllegalArgumentException("No candidates for given conditions");

    int idx = 0;
    List<CandidateEntity> saved = new ArrayList<>();
    for (CandidateDraft d : drafts) {
      CandidateEntity ce = CandidateEntity.of(
          prep.id,
          idx++,
          d.destLat,
          d.destLng,
          d.itineraryLines,
          d.travelSummary,
          d.travelLines,
          d.totalMin
      );
      saved.add(candidateRepo.save(ce));
      if (idx >= 5) break; // ✅ 최대 5개
    }

    return new PrepWithCandidatesRes(toPrepRes(prep), saved.stream().map(this::toCandidateRes).toList());
  }

  @Transactional(readOnly = true)
  public PrepWithCandidatesRes reveal(UUID appointmentId) {
    PrepEntity prep = prepRepo.findTopByAppointmentIdOrderByPreparedAtDesc(appointmentId)
        .orElseThrow(() -> new IllegalArgumentException("Prep not found"));

    List<CandidateEntity> cs = candidateRepo.findByPrepIdOrderByOrderIndexAsc(prep.id);
    return new PrepWithCandidatesRes(toPrepRes(prep), cs.stream().map(this::toCandidateRes).toList());
  }

  // ---------- 추천 로직(현재 프론트와 동일한 가중치 컨셉) ----------
  private List<CandidateDraft> recommend(AppointmentEntity ap, PrepEntity prep, List<PoiEntity> pois) {
    int durationMin = ap.getDurationMin();
    double scale = Math.max(0.6, Math.min(1.6, durationMin / 90.0));

    double maxDistanceM =
        (prep.travelMode == TravelMode.WALK ? 2500 :
         prep.travelMode == TravelMode.BICYCLE ? 6500 :
         prep.travelMode == TravelMode.TRANSIT ? 14000 :
         22000) * scale;

    double speedMpm =
        prep.travelMode == TravelMode.WALK ? 80 :
        prep.travelMode == TravelMode.BICYCLE ? 220 :
        prep.travelMode == TravelMode.TRANSIT ? 350 :
        550;

    int bicyclePenalty = 3;
    int carPenalty = 8;
    int transitWait = 6;
    int transitTransfer = 4;

    List<PoiEntity> shuffled = new ArrayList<>(pois);
    Collections.shuffle(shuffled);

    List<CandidateDraft> out = new ArrayList<>();
    for (PoiEntity poi : shuffled) {
      double d = Geo.distanceM(prep.originLat, prep.originLng, poi.lat, poi.lng);
      if (d > maxDistanceM) continue;

      int baseMove = Math.max(1, (int)Math.round(d / speedMpm));

      TravelComputed tc;
      switch (prep.travelMode) {
        case WALK -> tc = walk(baseMove);
        case BICYCLE -> tc = bicycle(baseMove, bicyclePenalty);
        case CAR -> tc = car(baseMove, carPenalty);
        case TRANSIT -> tc = transit(d, baseMove, transitWait, transitTransfer);
        default -> throw new IllegalArgumentException("Unknown mode");
      }

      List<String> itinerary = itineraryLines(ap.getTimeSlot(), ap.getDurationMin(), tc.totalMin);

      out.add(new CandidateDraft(poi.lat, poi.lng, itinerary, tc.summary, tc.lines, tc.totalMin));
    }

    out.sort(Comparator.comparingInt(a -> a.totalMin));
    return out;
  }

  private TravelComputed walk(int baseMove) {
    int total = baseMove;
    return new TravelComputed(total, "도보 " + total + "분", List.of(new TravelLineEmbeddable("도보", total)));
  }

  private TravelComputed bicycle(int baseMove, int penalty) {
    int total = baseMove + penalty;
    return new TravelComputed(total, "자전거 " + total + "분",
        List.of(new TravelLineEmbeddable("이동", baseMove), new TravelLineEmbeddable("정리", penalty)));
  }

  private TravelComputed car(int baseMove, int parking) {
    int total = baseMove + parking;
    return new TravelComputed(total, "자차 " + total + "분",
        List.of(new TravelLineEmbeddable("운전", baseMove), new TravelLineEmbeddable("주차/도보", parking)));
  }

  private TravelComputed transit(double distanceM, int baseMove, int wait, int transfer) {
    int lastWalk = Geo.clamp((int)Math.round(distanceM / 2500.0) + 4, 4, 10);
    int ride = Math.max(3, baseMove - lastWalk);
    int total = wait + transfer + ride + lastWalk;
    return new TravelComputed(total, "대중교통 " + total + "분",
        List.of(
            new TravelLineEmbeddable("대기", wait),
            new TravelLineEmbeddable("환승", transfer),
            new TravelLineEmbeddable("탑승", ride),
            new TravelLineEmbeddable("도보", lastWalk)
        ));
  }

  private List<String> itineraryLines(Enums.TimeSlot slot, int durationMin, int travelMin) {
    // “감성 과다” 없이: 일정만 두 줄
    int usable = Math.max(25, durationMin - Math.min(travelMin, 35));
    int a1 = Math.max(10, (int)Math.round(usable * 0.45));
    int a2 = Math.max(10, usable - a1);

    // 문구는 최소한으로
    String head =
        slot == Enums.TimeSlot.MORNING ? "가볍게" :
        slot == Enums.TimeSlot.AFTERNOON ? "환기" : "정리";

    return List.of(
        a1 + "분 · " + head + " 하나",
        a2 + "분 · 기록하고 마무리"
    );
  }

  // ---------- 엔티티 -> 응답 ----------
  private PrepRes toPrepRes(PrepEntity p) {
    return new PrepRes(p.id, p.appointmentId, p.travelMode, p.originLat, p.originLng, p.preparedAt);
  }

  private CandidateRes toCandidateRes(CandidateEntity c) {
    return new CandidateRes(
        c.id,
        new Point(c.destLat, c.destLng),
        c.itineraryLines,
        new TravelBreakdown(
            c.travelTotalMin,
            c.travelSummary,
            c.travelLines.stream().map(t -> new TravelLine(t.label(), t.min())).collect(Collectors.toList())
        )
    );
  }

  private record TravelComputed(int totalMin, String summary, List<TravelLineEmbeddable> lines) {}
  private record CandidateDraft(
      double destLat,
      double destLng,
      List<String> itineraryLines,
      String travelSummary,
      List<TravelLineEmbeddable> travelLines,
      int totalMin
  ) {}
}
