package com.littleescape.api.service;

import com.littleescape.api.domain.*;
import com.littleescape.api.domain.Enums.TravelMode;
import com.littleescape.api.persist.TravelLineEmbeddable;
import com.littleescape.api.repo.*;
import com.littleescape.api.web.dto.PrepDtos;
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

  @Transactional(readOnly = true)
  public PrepWithCandidatesRes reveal(UUID appointmentId) {
    PrepEntity prep = prepRepo.findTopByAppointmentIdOrderByPreparedAtDesc(appointmentId)
        .orElseThrow(() -> new IllegalArgumentException("Prep not found"));

    List<CandidateEntity> cs = candidateRepo.findByPrepIdOrderByOrderIndexAsc(prep.id);
    return new PrepWithCandidatesRes(toPrepRes(prep), cs.stream().map(this::toCandidateRes).toList());
  }

  @Transactional
  public PrepWithCandidatesRes createPrepAndCandidates(UUID appointmentId, TravelMode mode, double oLat, double oLng) {
    AppointmentEntity ap = appointmentRepo.findById(appointmentId)
        .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

    prepRepo.findTopByAppointmentIdOrderByPreparedAtDesc(appointmentId).ifPresent(prev -> {
      candidateRepo.deleteByPrepId(prev.id);
    });

    PrepEntity prep = PrepEntity.of(appointmentId, mode, oLat, oLng);
    prepRepo.save(prep);

    List<PoiEntity> pois = poiRepo.findByActiveTrue();
    if (pois.isEmpty()) throw new IllegalArgumentException("POI seed is empty");

    List<CandidateDraft> drafts = recommend(ap, prep, pois);

    // ✅ 0개면 가까운 POI로 강제 후보 생성(최대 5개)
    if (drafts.isEmpty()) {
      drafts = fallbackNearest(ap, prep, pois, 5);
    }
    
    if (drafts.isEmpty()) throw new IllegalArgumentException("No candidates even after fallback");    

    // 그래도 없으면 진짜 이상한 상태
    if (drafts.isEmpty()) throw new IllegalArgumentException("No candidates even after fallback");

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
      if (idx >= 5) break;
    }

    return new PrepWithCandidatesRes(toPrepRes(prep), saved.stream().map(this::toCandidateRes).toList());
  }

  private List<CandidateDraft> fallbackNearest(
    AppointmentEntity ap,
    PrepEntity prep,
    List<PoiEntity> pois,
    int limit
) {
  // 가까운 순으로 정렬
  List<PoiEntity> sorted = new ArrayList<>(pois);
  sorted.sort(Comparator.comparingDouble(p ->
      Geo.distanceM(prep.originLat, prep.originLng, p.lat, p.lng)
  ));

  int durationMin = ap.getDurationMin();
  double scale = Math.max(0.6, Math.min(1.6, durationMin / 90.0));

  // recommend()와 동일한 speedMpm 사용
  double speedMpm =
      prep.travelMode == TravelMode.WALK ? 80 :
      prep.travelMode == TravelMode.BICYCLE ? 220 :
      prep.travelMode == TravelMode.TRANSIT ? 350 :
      550;

  int bicyclePenalty = 3;
  int carPenalty = 8;
  int transitWait = 6;
  int transitTransfer = 4;

  List<CandidateDraft> out = new ArrayList<>();

  for (PoiEntity poi : sorted) {
    double d = Geo.distanceM(prep.originLat, prep.originLng, poi.lat, poi.lng);

    int baseMove = Math.max(1, (int) Math.round(d / speedMpm));

    TravelComputed tc;
    switch (prep.travelMode) {
      case WALK -> tc = walk(baseMove);
      case BICYCLE -> tc = bicycle(baseMove, bicyclePenalty);
      case CAR -> tc = car(baseMove, carPenalty);
      case TRANSIT -> tc = transit(d, baseMove, transitWait, transitTransfer);
      default -> throw new IllegalArgumentException("Unknown mode");
    }

    List<String> itinerary = itineraryLines(ap.getTimeSlot(), ap.getDurationMin(), tc.totalMin);

    out.add(new CandidateDraft(
        poi.lat,
        poi.lng,
        itinerary,
        tc.summary,
        tc.lines,
        tc.totalMin
    ));

    if (out.size() >= limit) break;
  }

  out.sort(Comparator.comparingInt(d -> d.totalMin));
  return out;
}

private static String travelLabel(TravelMode mode) {
  return switch (mode) {
    case WALK -> "도보";
    case TRANSIT -> "대중교통";
    case CAR -> "차량";
    case BICYCLE -> "자전거";
  };
}

private static String travelSummary(TravelMode mode, int totalMin) {
  return travelLabel(mode) + " 약 " + totalMin + "분";
}

/** 거리(m)에 따른 대충 추정 이동시간(분) */
private static int estimateTravelMin(TravelMode mode, double meters) {
  // 아주 거친 평균 속도(폴백용)
  double speedMps = switch (mode) {
    case WALK -> 1.3;      // ~4.7km/h
    case BICYCLE -> 4.2;   // ~15km/h
    case TRANSIT -> 6.9;   // ~25km/h
    case CAR -> 8.3;       // ~30km/h (도심)
  };
  int min = (int) Math.round((meters / speedMps) / 60.0);
  return Math.max(5, Math.min(min, 120)); // 5~120분 클램프
}

/** 약속 길이/시간대 기반으로 텍스트 구성(장소명 없음) */
private static List<String> buildItineraryLines(AppointmentEntity ap, int travelMin) {
  int stay = Math.max(20, ap.getDurationMin() - travelMin);
  return List.of(
      "이동 (" + travelMin + "분)",
      "현장 활동 (" + stay + "분)",
      "정리 & 귀가 준비"
  );
}

/** 위도경도 거리 계산(m) */
private static double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
  double R = 6371000.0;
  double dLat = Math.toRadians(lat2 - lat1);
  double dLon = Math.toRadians(lon2 - lon1);
  double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

    double floorM =
         (prep.travelMode == TravelMode.WALK ? 3500 :
          prep.travelMode == TravelMode.BICYCLE ? 7000 :
          prep.travelMode == TravelMode.TRANSIT ? 12000 :
          16000);
     
     maxDistanceM = Math.max(maxDistanceM, floorM);
     

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
