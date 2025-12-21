package com.littleescape.recommend.domain;

import com.littleescape.common.domain.BaseTimeEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "candidates")
public class Candidate extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long sessionId;

    @Column(nullable = false)
    private double destLat;

    @Column(nullable = false)
    private double destLng;

    @Column(nullable = false)
    private String destName;

    @Column(nullable = false)
    private String areaName;

    @Column(nullable = false)
    private double score;

    @Column(nullable = false, length = 4000)
    private String featuresJson;

    @Column(nullable = false, length = 4000)
    private String poiJson;

    private Long routePlanId;

    protected Candidate() {}

    public Candidate(Long sessionId, double destLat, double destLng, String destName, String areaName,
                     double score, String featuresJson, String poiJson, Long routePlanId) {
        this.sessionId = sessionId;
        this.destLat = destLat;
        this.destLng = destLng;
        this.destName = destName;
        this.areaName = areaName;
        this.score = score;
        this.featuresJson = featuresJson;
        this.poiJson = poiJson;
        this.routePlanId = routePlanId;
    }

    public Long getId() { return id; }
    public Long getSessionId() { return sessionId; }
    public double getDestLat() { return destLat; }
    public double getDestLng() { return destLng; }
    public String getDestName() { return destName; }
    public String getAreaName() { return areaName; }
    public double getScore() { return score; }
    public String getPoiJson() { return poiJson; }
    public Long getRoutePlanId() { return routePlanId; }
}