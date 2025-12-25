package com.littleescape.api.web.dto;

import com.littleescape.api.domain.Enums.TravelMode;
import jakarta.validation.constraints.*;

import java.util.List;
import java.util.UUID;

public class PrepDtos {

  public record CreatePrepReq(
      @NotNull TravelMode travelMode,
      @NotNull Double originLat,
      @NotNull Double originLng
  ) {}

  public record PrepRes(
      UUID id,
      UUID appointmentId,
      TravelMode travelMode,
      double originLat,
      double originLng,
      long preparedAt
  ) {}

  public record Point(double lat, double lng) {}

  public record TravelLine(String label, int min) {}

  public record TravelBreakdown(
      int totalMin,
      String summary,
      List<TravelLine> lines
  ) {}

  public record CandidateRes(
      UUID id,
      Point point,
      List<String> itineraryLines,
      TravelBreakdown travel
  ) {}

  public record PrepWithCandidatesRes(
      PrepRes prep,
      List<CandidateRes> candidates
  ) {}
}
