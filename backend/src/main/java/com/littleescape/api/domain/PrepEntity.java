package com.littleescape.api.domain;

import jakarta.persistence.*;
import java.util.UUID;

import static com.littleescape.api.domain.Enums.*;

@Entity
@Table(name = "preps")
public class PrepEntity {
  @Id
  public UUID id;

  @Column(name = "appointment_id", nullable = false)
  public UUID appointmentId;

  @Enumerated(EnumType.STRING)
  @Column(name = "travel_mode", nullable = false)
  public TravelMode travelMode;

  @Column(name = "origin_lat", nullable = false)
  public double originLat;

  @Column(name = "origin_lng", nullable = false)
  public double originLng;

  @Column(name = "prepared_at", nullable = false)
  public long preparedAt;

  public static PrepEntity of(UUID appointmentId, TravelMode travelMode, double lat, double lng) {
    PrepEntity p = new PrepEntity();
    p.id = UUID.randomUUID();
    p.appointmentId = appointmentId;
    p.travelMode = travelMode;
    p.originLat = lat;
    p.originLng = lng;
    p.preparedAt = System.currentTimeMillis();
    return p;
  }
}
