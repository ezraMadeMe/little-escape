package com.littleescape.api.domain;

import jakarta.persistence.*;
import java.util.UUID;

import com.littleescape.api.domain.Enums.Day;
import com.littleescape.api.domain.Enums.TimeSlot;

@Getter
@Entity
@Table(name = "appointments")
public class AppointmentEntity {
  @Id
  public UUID id;

  @Enumerated(EnumType.STRING)
  @Column(name = "day_code", nullable = false, length = 16)
  private Enums.Day day;

  @Enumerated(EnumType.STRING)
  @Column(name = "time_slot", nullable = false, length = 16)
  private Enums.TimeSlot timeSlot;

  @Column(name = "duration_min", nullable = false)
  private int durationMin;

  @Column(name = "created_at", nullable = false)
  private long createdAt;

  protected AppointmentEntity() {}

  public Enums.Day getDay() { return day; }
  public Enums.TimeSlot getTimeSlot() { return timeSlot; }
  public int getDurationMin() { return durationMin; }
  public long getCreatedAt() { return createdAt; }

  public static AppointmentEntity of(Day day, TimeSlot timeSlot, int durationMin) {
    AppointmentEntity e = new AppointmentEntity();
    e.id = UUID.randomUUID();
    e.day = day;
    e.timeSlot = timeSlot;
    e.durationMin = durationMin;
    e.createdAt = System.currentTimeMillis();
    return e;
  }
}
