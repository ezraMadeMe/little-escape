package com.littleescape.trip.domain;

import com.littleescape.common.domain.BaseTimeEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "trip_sessions")
public class TripSession extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransportMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status;

    @Column(nullable = false)
    private double originLat;

    @Column(nullable = false)
    private double originLng;

    @Column(nullable = false)
    private String budgetType; // ROUND_TRIP_MIN, ONE_WAY_MIN

    @Column(nullable = false)
    private int budgetValue;

    @Column(nullable = false, length = 2000)
    private String constraintsJson;

    @Column(nullable = false, length = 2000)
    private String moodTagsJson;

    private Long acceptedCandidateId;

    protected TripSession() {}

    public TripSession(Long userId, TransportMode mode, double originLat, double originLng,
                       String budgetType, int budgetValue, String constraintsJson, String moodTagsJson) {
        this.userId = userId;
        this.mode = mode;
        this.status = SessionStatus.RECOMMENDING;
        this.originLat = originLat;
        this.originLng = originLng;
        this.budgetType = budgetType;
        this.budgetValue = budgetValue;
        this.constraintsJson = constraintsJson;
        this.moodTagsJson = moodTagsJson;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public TransportMode getMode() { return mode; }
    public SessionStatus getStatus() { return status; }
    public double getOriginLat() { return originLat; }
    public double getOriginLng() { return originLng; }
    public String getBudgetType() { return budgetType; }
    public int getBudgetValue() { return budgetValue; }
    public String getConstraintsJson() { return constraintsJson; }
    public String getMoodTagsJson() { return moodTagsJson; }
    public Long getAcceptedCandidateId() { return acceptedCandidateId; }

    public void accept(Long candidateId) {
        this.acceptedCandidateId = candidateId;
        this.status = SessionStatus.ACCEPTED;
    }

    public void complete() { this.status = SessionStatus.COMPLETED; }
    public void cancel() { this.status = SessionStatus.CANCELED; }
}