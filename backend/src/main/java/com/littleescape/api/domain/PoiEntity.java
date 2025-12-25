package com.littleescape.api.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "pois")
public class PoiEntity {
  @Id
  public UUID id;

  @Column(nullable = false)
  public double lat;

  @Column(nullable = false)
  public double lng;

  @Column(nullable = false)
  public boolean active;
}
