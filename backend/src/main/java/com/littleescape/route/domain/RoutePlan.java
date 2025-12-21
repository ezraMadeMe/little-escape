package com.littleescape.route.domain;

import com.littleescape.common.domain.BaseTimeEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "route_plans")
public class RoutePlan extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String provider; // KAKAO_MOBILITY

    @Column(nullable = false)
    private int distanceM;

    @Column(nullable = false)
    private int durationSec;

    @Column(nullable = false, length = 20000)
    private String polyline;

    @Column(nullable = false, length = 4000)
    private String providerMetaJson;

    protected RoutePlan() {}

    public RoutePlan(String provider, int distanceM, int durationSec, String polyline, String providerMetaJson) {
        this.provider = provider;
        this.distanceM = distanceM;
        this.durationSec = durationSec;
        this.polyline = polyline;
        this.providerMetaJson = providerMetaJson;
    }

    public Long getId() { return id; }
    public String getProvider() { return provider; }
    public int getDistanceM() { return distanceM; }
    public int getDurationSec() { return durationSec; }
    public String getPolyline() { return polyline; }
}