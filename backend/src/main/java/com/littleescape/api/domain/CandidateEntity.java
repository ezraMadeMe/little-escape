package com.littleescape.api.domain;

import com.littleescape.api.persist.JsonStringListConverter;
import com.littleescape.api.persist.JsonTravelLinesConverter;
import com.littleescape.api.persist.TravelLineEmbeddable;
import jakarta.persistence.*;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "candidates")
public class CandidateEntity {
  @Id
  public UUID id;

  @Column(name = "prep_id", nullable = false)
  public UUID prepId;

  @Column(name = "order_index", nullable = false)
  public int orderIndex;

  @Column(name = "dest_lat", nullable = false)
  public double destLat;

  @Column(name = "dest_lng", nullable = false)
  public double destLng;

  @Convert(converter = JsonStringListConverter.class)
  @Column(name = "itinerary_lines", nullable = false, columnDefinition = "text")
  public List<String> itineraryLines;

  @Column(name = "travel_summary", nullable = false)
  public String travelSummary;

  @Convert(converter = JsonTravelLinesConverter.class)
  @Column(name = "travel_lines", nullable = false, columnDefinition = "text")
  public List<TravelLineEmbeddable> travelLines;

  @Column(name = "travel_total_min", nullable = false)
  public int travelTotalMin;

  public static CandidateEntity of(UUID prepId, int orderIndex, double lat, double lng,
                                   List<String> itineraryLines, String travelSummary,
                                   List<TravelLineEmbeddable> travelLines, int totalMin) {
    CandidateEntity c = new CandidateEntity();
    c.id = UUID.randomUUID();
    c.prepId = prepId;
    c.orderIndex = orderIndex;
    c.destLat = lat;
    c.destLng = lng;
    c.itineraryLines = itineraryLines;
    c.travelSummary = travelSummary;
    c.travelLines = travelLines;
    c.travelTotalMin = totalMin;
    return c;
  }
}
